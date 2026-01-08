import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SourcesTab } from './SourcesTab';
import { KeywordsTab } from './KeywordsTab';
import { Globe, Tags } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Paramètres</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="sources" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sources" className="gap-2">
              <Globe className="w-4 h-4" />
              Sources
            </TabsTrigger>
            <TabsTrigger value="keywords" className="gap-2">
              <Tags className="w-4 h-4" />
              Mots-clés
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sources" className="flex-1 overflow-auto mt-4">
            <SourcesTab />
          </TabsContent>
          <TabsContent value="keywords" className="flex-1 overflow-auto mt-4">
            <KeywordsTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};