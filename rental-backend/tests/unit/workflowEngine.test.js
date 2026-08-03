const workflowController = require('../../controllers/workflowController');
const supabase = require('../../config/supabase');

jest.mock('../../config/supabase');

describe('Rental OS Workflow Automation Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkflow', () => {
    it('creates and records a new trigger-action workflow template', async () => {
      const req = {
        body: {
          name: 'Generate PDFs & Alerts',
          triggerEvent: 'booking.created',
          actions: [{ type: 'generate_invoice' }]
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'flow-123',
            name: 'Generate PDFs & Alerts',
            trigger_event: 'booking.created',
            actions: [{ type: 'generate_invoice' }]
          },
          error: null
        })
      });

      await workflowController.createWorkflow(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        workflow: expect.objectContaining({ name: 'Generate PDFs & Alerts' })
      }));
    });
  });

  describe('triggerWorkflow', () => {
    it('runs workflow steps sequentially and writes debug traces to logs database', async () => {
      const req = {
        params: { id: 'flow-123' },
        body: { context: { bookingId: 'b-999' } }
      };
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      // Mock finding workflow
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'flow-123',
            name: 'Notify dispatchers',
            trigger_event: 'booking.approved',
            actions: [{ type: 'generate_invoice' }, { type: 'send_sms_alert' }]
          },
          error: null
        })
      });

      // Mock logging execution trace
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      await workflowController.triggerWorkflow(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        logs: expect.arrayContaining([
          'Executed action: generate_invoice',
          'Executed action: send_sms_alert'
        ])
      }));
    });
  });
});
