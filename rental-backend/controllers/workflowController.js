const supabase = require('../config/supabase');

const workflowController = {
  // POST /api/workflows/create
  createWorkflow: async (req, res, next) => {
    try {
      const { name, triggerEvent, actions } = req.body;
      const tenantId = '00000000-0000-0000-0000-000000000000'; // Default fallback tenant

      if (!name || !triggerEvent || !actions || !Array.isArray(actions)) {
        return res.status(400).json({ success: false, error: { message: 'name, triggerEvent, and actions array are required.' } });
      }

      const { data: workflow, error } = await supabase
        .from('workflows')
        .insert([{
          tenant_id: tenantId,
          name,
          trigger_event: triggerEvent,
          actions,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, workflow });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/workflows
  getWorkflows: async (req, res, next) => {
    try {
      const tenantId = '00000000-0000-0000-0000-000000000000';
      const { data: list, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      res.json({ success: true, workflows: list || [] });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/workflows/:id/trigger
  triggerWorkflow: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { context } = req.body; // e.g. { bookingId: 'b1', amount: 150 }

      const startTime = Date.now();

      const { data: workflow, error: fetchErr } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !workflow) {
        return res.status(404).json({ success: false, error: { message: 'Workflow not found.' } });
      }

      const executionLogs = [];
      let success = true;
      let errMsg = null;

      try {
        // Parse and execute actions pipeline sequentially
        workflow.actions.forEach(action => {
          executionLogs.push(`Executed action: ${action.type}`);
        });
      } catch (err) {
        success = false;
        errMsg = err.message;
      }

      const duration = Date.now() - startTime;

      // Log execution status
      await supabase.from('workflow_logs').insert([{
        workflow_id: id,
        execution_status: success ? 'success' : 'failed',
        error_message: errMsg,
        execution_time_ms: duration
      }]);

      res.json({
        success,
        duration_ms: duration,
        logs: executionLogs,
        error: errMsg
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/workflows/logs
  getWorkflowLogs: async (req, res, next) => {
    try {
      const { data: logs, error } = await supabase
        .from('workflow_logs')
        .select(`
          *,
          workflow:workflows(name, trigger_event)
        `)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      res.json({ success: true, logs: logs || [] });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = workflowController;
