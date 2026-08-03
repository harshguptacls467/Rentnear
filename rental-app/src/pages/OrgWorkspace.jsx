import React, { useState, useEffect } from 'react';
import { 
  Building, Users, FileText, Settings, ShieldCheck, CreditCard, 
  Upload, Download, Plus, Mail, ShieldAlert, BadgeInfo 
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { orgService } from '../api/orgService';
import Button from '../components/Button';
import AnimatedPage from '../components/AnimatedPage';
import Skeleton from '../components/Skeleton';

const OrgWorkspace = () => {
  const { user, token, isMock } = useAuthStore();
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [billing, setBilling] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Org Create Form State
  const [orgName, setOrgName] = useState('');
  const [gstId, setGstId] = useState('');
  const [creating, setCreating] = useState(false);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  // Bulk Upload State
  const [csvText, setCsvText] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);

  useEffect(() => {
    const initWorkspace = async () => {
      try {
        setLoading(true);
        if (token && !isMock) {
          // Fetch user organizations or check from memberships
          // For simplicity, mock first or fetch if exists
        } else {
          // Mock Org Setup Fallback
          setOrg({
            id: 'org-123',
            name: 'Apex Equipment Rentals',
            tax_id: '29ABCDE1234F1Z5',
            is_verified: true,
            credit_limit: 5000.00
          });
          setMembers([
            { id: 'm1', role: 'owner', user: { name: user?.name || 'Harsh', email: user?.email, avatar_url: '' } },
            { id: 'm2', role: 'finance', user: { name: 'Sarah Jenkins', email: 'sarah@apexrent.com', avatar_url: '' } },
            { id: 'm3', role: 'staff', user: { name: 'John Doe', email: 'john@apexrent.com', avatar_url: '' } }
          ]);
          setBilling([
            { id: 'b1', start_date: '2026-08-01', end_date: '2026-08-03', total_amount: 150.00, status: 'completed', product: { title: 'Sony A7 IV' } }
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initWorkspace();
  }, [user, token, isMock]);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!orgName) return;
    try {
      setCreating(true);
      if (token && !isMock) {
        const res = await orgService.createOrg({ name: orgName, taxId: gstId }, token);
        if (res.success) {
          setOrg(res.organization);
        }
      } else {
        setOrg({
          id: 'org-new',
          name: orgName,
          tax_id: gstId,
          is_verified: false,
          credit_limit: 0.00
        });
      }
    } catch (err) {
      alert(err.message || 'Creation failed.');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      setInviting(true);
      if (token && !isMock) {
        const res = await orgService.inviteMember(org.id, { email: inviteEmail, role: inviteRole }, token);
        if (res.success) {
          setInviteLink(res.inviteLink);
        }
      } else {
        setInviteLink(`/workspace/accept?token=mock-token-${Date.now()}`);
      }
    } catch (err) {
      alert(err.message || 'Invite failed.');
    } finally {
      setInviting(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!csvText) return;
    try {
      setBulkUploading(true);
      // Parsing simple CSV lines: title, category, price_per_day, deposit_amount
      const lines = csvText.split('\n');
      const products = [];
      lines.forEach((line, idx) => {
        if (idx === 0) return; // skip header
        const parts = line.split(',');
        if (parts.length >= 3) {
          products.push({
            title: parts[0].trim(),
            category: parts[1].trim(),
            price_per_day: parseFloat(parts[2].trim()) || 20,
            deposit_amount: parseFloat(parts[3]?.trim()) || 0
          });
        }
      });

      if (token && !isMock) {
        const res = await orgService.bulkUploadInventory(org.id, products, token);
        if (res.success) {
          alert(`Successfully uploaded ${res.products.length} products!`);
          setCsvText('');
        }
      } else {
        alert(`Successfully imported ${products.length} mock inventory items!`);
        setCsvText('');
      }
    } catch (err) {
      alert(err.message || 'Upload failed.');
    } finally {
      setBulkUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  // Render onboarding org creation form if user has no org setup
  if (!org) {
    return (
      <AnimatedPage>
        <div className="max-w-md mx-auto my-16 bg-white border border-gray-150 p-8 rounded-[2rem] shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <Building className="mx-auto text-primary" size={44} />
            <h2 className="text-xl font-black text-navy">Setup Business Workspace</h2>
            <p className="text-xs text-gray-500">RentNear Pro equips your business team with bulk uploads, GST invoicing, and staff RBAC permissions.</p>
          </div>

          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Company name</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Apex Equipment Rentals"
                className="w-full border border-gray-250 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">GST identification number (Optional)</label>
              <input
                type="text"
                value={gstId}
                onChange={(e) => setGstId(e.target.value)}
                placeholder="29ABCDE1234F1Z5"
                className="w-full border border-gray-250 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={creating}
              className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-600 hover:to-primary text-white font-bold"
            >
              {creating ? 'Initializing...' : 'Initialize Workspace'}
            </Button>
          </form>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* Workspace Header Dashboard Banner */}
        <div className="bg-gradient-to-r from-navy via-slate-900 to-indigo-950 text-white rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black">{org.name}</h2>
              {org.is_verified ? (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck size={12} /> Verified Business
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <ShieldAlert size={12} /> Pending Verification
                </span>
              )}
            </div>
            <p className="text-xs text-indigo-200">GSTIN: {org.tax_id || 'Not Registered'}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-indigo-300">Corporate Credit Limit</span>
            <span className="text-2xl font-black text-white">${org.credit_limit}</span>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Workspace Overview', icon: Building },
            { id: 'team', label: 'Team Management', icon: Users },
            { id: 'inventory', label: 'Pro Inventory (CSV)', icon: Upload },
            { id: 'billing', label: 'GST Billing & Invoices', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-bold border-b-2 transition-all ${
                  active ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-navy'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Tab Body Render */}
        <div className="space-y-6">
          
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Team Size</span>
                <div className="text-2xl font-black text-navy">{members.length} members</div>
              </div>
              <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Fleet Utilization</span>
                <div className="text-2xl font-black text-navy">78.5% Occupancy</div>
              </div>
              <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Active Bookings</span>
                <div className="text-2xl font-black text-navy">{billing.length} rentals</div>
              </div>
            </div>
          )}

          {/* Tab 2: Team Management */}
          {activeTab === 'team' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Member invites */}
              <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4 h-fit">
                <h4 className="font-extrabold text-navy text-sm flex items-center gap-1.5"><Mail size={16} /> Invite Workspace Member</h4>
                
                <form onSubmit={handleInvite} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Member Email</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="teammate@company.com"
                      className="w-full border border-gray-250 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Role Access Scope</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold"
                    >
                      <option value="admin">Administrator</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff Inspector</option>
                      <option value="finance">Finance Auditor</option>
                      <option value="viewer">Viewer (Read-only)</option>
                    </select>
                  </div>

                  <Button type="submit" disabled={inviting} className="w-full text-xs">
                    {inviting ? 'Inviting...' : 'Send Invitation Link'}
                  </Button>
                </form>

                {inviteLink && (
                  <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-indigo-700 uppercase">Share this invite url link:</div>
                    <input
                      type="text"
                      readOnly
                      value={window.location.origin + inviteLink}
                      className="w-full text-[10px] bg-white border border-indigo-200 rounded px-2 py-1 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Members List */}
              <div className="lg:col-span-2 bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4">
                <h4 className="font-extrabold text-navy text-sm">Active Members ({members.length})</h4>
                <div className="divide-y divide-gray-100">
                  {members.map(member => (
                    <div key={member.id} className="flex justify-between items-center py-4">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{member.user.name}</div>
                        <div className="text-xs text-gray-400">{member.user.email}</div>
                      </div>
                      <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 uppercase px-3 py-1 rounded-full border border-indigo-200">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Pro Inventory Bulk Upload */}
          {activeTab === 'inventory' && (
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-6">
              <div>
                <h4 className="font-extrabold text-navy text-sm flex items-center gap-1.5"><Upload size={16} /> Bulk Inventory CSV Upload</h4>
                <p className="text-xs text-gray-500 mt-1">Paste CSV raw data values directly below to insert multiple products instantly.</p>
              </div>

              <form onSubmit={handleBulkUpload} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase flex justify-between">
                    <span>CSV Plaintext Input</span>
                    <span className="text-indigo-600 font-bold">Format: title, category, price_per_day, deposit_amount</span>
                  </label>
                  <textarea
                    rows={6}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="title, category, price_per_day, deposit_amount&#10;Sony A7 IV, Cameras, 65, 30&#10;Bosch Drill, Tools, 25, 10"
                    className="w-full border border-gray-250 rounded-xl py-3 px-4 text-xs font-semibold font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="submit"
                    disabled={bulkUploading || !csvText}
                    className="bg-gradient-to-r from-primary to-indigo-600 border-transparent text-white"
                  >
                    {bulkUploading ? 'Uploading...' : 'Confirm Bulk Upload'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 4: GST Billing */}
          {activeTab === 'billing' && (
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <h4 className="font-extrabold text-navy text-sm">Monthly GST Invoice Summary</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Corporate tax invoices generated for completed business bookings.</p>
                </div>
                <Button className="text-xs flex items-center gap-1" variant="secondary">
                  <Download size={14} /> Download Ledger
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      <th className="p-3">Rent Period</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 text-right">Taxable Value</th>
                      <th className="p-3 text-right">GST (18%)</th>
                      <th className="p-3 text-right">Total Invoice</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {billing.map(invoice => {
                      const tax = invoice.total_amount * 0.18;
                      const taxable = invoice.total_amount - tax;
                      return (
                        <tr key={invoice.id} className="text-gray-700">
                          <td className="p-3 font-semibold">{invoice.start_date} to {invoice.end_date}</td>
                          <td className="p-3 font-bold text-gray-900">{invoice.product?.title}</td>
                          <td className="p-3 text-right">${taxable.toFixed(2)}</td>
                          <td className="p-3 text-right">${tax.toFixed(2)}</td>
                          <td className="p-3 text-right font-black text-navy">${invoice.total_amount.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                              {invoice.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </AnimatedPage>
  );
};

export default OrgWorkspace;
