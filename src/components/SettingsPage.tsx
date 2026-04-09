import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Upload, Save, Image, Users, FileText, HardDrive, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import BackupRestore from '@/components/BackupRestore';
import ModuleGuide from '@/components/ModuleGuide';
import { moduleGuides } from '@/data/moduleGuides';
import FreshStartDialog from '@/components/FreshStartDialog';

interface ProjectSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo: string;
  companyStamp: string;
  projectName: string;
  projectLocation: string;
  projectStartDate: string;
  projectEndDate: string;
  contractValue: string;
  currency: string;
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  clientRepresentative: string;
  contractorName: string;
  contractorAddress: string;
  contractorPhone: string;
  contractorEmail: string;
  contractorRepresentative: string;
  contractorLicense: string;
  consultantName: string;
  consultantAddress: string;
  consultantPhone: string;
  consultantEmail: string;
}

const defaultSettings: ProjectSettings = {
  companyName: 'BuildForge Engineering',
  companyAddress: 'P.O. Box 12345, Business Bay, Dubai, UAE',
  companyPhone: '+971 4 123 4567',
  companyEmail: 'info@buildforge.ae',
  companyLogo: '',
  companyStamp: '',
  projectName: 'Marina Bay Commercial Complex',
  projectLocation: 'Dubai Marina, Plot 47',
  projectStartDate: '2025-01-15',
  projectEndDate: '2027-06-30',
  contractValue: '285,000,000',
  currency: 'AED',
  clientName: 'Marina Bay Developments LLC',
  clientAddress: 'Dubai Marina, Tower 5, Office 2301',
  clientPhone: '+971 4 987 6543',
  clientEmail: 'projects@marinabay.ae',
  clientRepresentative: 'Eng. Khalid Al-Mansoori',
  contractorName: 'BuildForge Engineering LLC',
  contractorAddress: 'Business Bay, Office 1504',
  contractorPhone: '+971 4 123 4567',
  contractorEmail: 'contracts@buildforge.ae',
  contractorRepresentative: 'Eng. James Mitchell',
  contractorLicense: 'DM-CON-2024-0847',
  consultantName: 'Al-Habtoor Engineering Consultants',
  consultantAddress: 'Sheikh Zayed Road, Floor 22',
  consultantPhone: '+971 4 456 7890',
  consultantEmail: 'supervision@alhabtoor-eng.ae',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<ProjectSettings>(() => {
    const saved = localStorage.getItem('buildforge-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const logoRef = useRef<HTMLInputElement>(null);
  const stampRef = useRef<HTMLInputElement>(null);

  const u = (key: keyof ProjectSettings, val: string) => setSettings(prev => ({ ...prev, [key]: val }));

  const handleImageUpload = (key: 'companyLogo' | 'companyStamp', file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum 2MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      u(key, e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    localStorage.setItem('buildforge-settings', JSON.stringify(settings));
    toast({ title: 'Settings Saved', description: 'Project settings updated successfully' });
  };

  const renderField = (label: string, field: keyof ProjectSettings, type = 'text', span = false) => (
    <div key={field} className={span ? 'col-span-2 space-y-1.5' : 'space-y-1.5'}>
      <Label className="text-xs font-medium">{label}</Label>
      <Input type={type} value={settings[field]} onChange={e => u(field, e.target.value)} />
    </div>
  );

  return (
    <div>
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Company details, client/contractor info, logos and stamps</p>
        </div>
        <Button onClick={save}><Save size={14} className="mr-1.5" /> Save Settings</Button>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company" className="text-xs"><Building2 size={14} className="mr-1.5" /> Company</TabsTrigger>
          <TabsTrigger value="project" className="text-xs"><FileText size={14} className="mr-1.5" /> Project</TabsTrigger>
          <TabsTrigger value="parties" className="text-xs"><Users size={14} className="mr-1.5" /> Parties</TabsTrigger>
          <TabsTrigger value="branding" className="text-xs"><Image size={14} className="mr-1.5" /> Branding</TabsTrigger>
          <TabsTrigger value="backup" className="text-xs"><HardDrive size={14} className="mr-1.5" /> Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h3 className="text-sm font-semibold mb-4">Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {renderField("Company Name", "companyName", "text", true)}
              {renderField("Address", "companyAddress", "text", true)}
              {renderField("Phone", "companyPhone")}
              {renderField("Email", "companyEmail", "email")}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="project">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h3 className="text-sm font-semibold mb-4">Project Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {renderField("Project Name", "projectName", "text", true)}
              {renderField("Location", "projectLocation", "text", true)}
              {renderField("Start Date", "projectStartDate", "date")}
              {renderField("End Date", "projectEndDate", "date")}
              {renderField("Contract Value", "contractValue")}
              {renderField("Currency", "currency")}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="parties">
          <div className="space-y-4">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="text-sm font-semibold mb-4">Client Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("Client Name", "clientName", "text", true)}
                {renderField("Address", "clientAddress", "text", true)}
                {renderField("Phone", "clientPhone")}
                {renderField("Email", "clientEmail", "email")}
                {renderField("Representative", "clientRepresentative", "text", true)}
              </div>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="text-sm font-semibold mb-4">Contractor Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("Contractor Name", "contractorName", "text", true)}
                {renderField("Address", "contractorAddress", "text", true)}
                {renderField("Phone", "contractorPhone")}
                {renderField("Email", "contractorEmail", "email")}
                {renderField("Representative", "contractorRepresentative")}
                {renderField("License No.", "contractorLicense")}
              </div>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="text-sm font-semibold mb-4">Consultant Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField("Consultant Name", "consultantName", "text", true)}
                {renderField("Address", "consultantAddress", "text", true)}
                {renderField("Phone", "consultantPhone")}
                {renderField("Email", "consultantEmail", "email")}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="branding">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h3 className="text-sm font-semibold mb-4">Logo & Stamp</h3>
            <div className="grid grid-cols-2 gap-8">
              {/* Logo */}
              <div className="space-y-3">
                <Label className="text-xs font-medium">Company Logo (for letterhead)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  {settings.companyLogo ? (
                    <div className="space-y-2">
                      <img src={settings.companyLogo} alt="Logo" className="max-h-24 mx-auto object-contain" />
                      <Button variant="ghost" size="sm" onClick={() => u('companyLogo', '')}>Remove</Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload size={24} className="mx-auto text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                    </div>
                  )}
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload('companyLogo', e.target.files[0])} />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => logoRef.current?.click()}>
                    <Upload size={14} className="mr-1.5" /> Upload Logo
                  </Button>
                </div>
              </div>

              {/* Stamp */}
              <div className="space-y-3">
                <Label className="text-xs font-medium">Company Stamp (for approvals)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  {settings.companyStamp ? (
                    <div className="space-y-2">
                      <img src={settings.companyStamp} alt="Stamp" className="max-h-24 mx-auto object-contain" />
                      <Button variant="ghost" size="sm" onClick={() => u('companyStamp', '')}>Remove</Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload size={24} className="mx-auto text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                    </div>
                  )}
                  <input ref={stampRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload('companyStamp', e.target.files[0])} />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => stampRef.current?.click()}>
                    <Upload size={14} className="mr-1.5" /> Upload Stamp
                  </Button>
                </div>
              </div>
            </div>

            {/* Letterhead Preview */}
            <div className="mt-8">
              <Label className="text-xs font-medium">Letterhead Preview</Label>
              <div className="mt-2 border rounded-lg p-6 bg-background">
                <div className="flex items-start justify-between border-b pb-4">
                  <div className="flex items-center gap-4">
                    {settings.companyLogo && <img src={settings.companyLogo} alt="Logo" className="h-16 object-contain" />}
                    <div>
                      <h2 className="text-lg font-bold">{settings.companyName}</h2>
                      <p className="text-xs text-muted-foreground">{settings.companyAddress}</p>
                      <p className="text-xs text-muted-foreground">{settings.companyPhone} · {settings.companyEmail}</p>
                    </div>
                  </div>
                  {settings.companyStamp && <img src={settings.companyStamp} alt="Stamp" className="h-16 object-contain opacity-50" />}
                </div>
                <div className="pt-3 text-center">
                  <p className="text-sm font-semibold">{settings.projectName}</p>
                  <p className="text-xs text-muted-foreground">{settings.projectLocation}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="backup">
          <BackupRestore />
        </TabsContent>
      </Tabs>
    </div>
  );
}
