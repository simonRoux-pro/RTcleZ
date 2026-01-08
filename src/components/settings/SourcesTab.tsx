import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Source, ArticleCategory, CATEGORY_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export const SourcesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '', category: 'other' as ArticleCategory });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setSources(data as Source[]);
    }
    setLoading(false);
  };

  const addSource = async () => {
    if (!newSource.name || !newSource.url) return;
    setAdding(true);

    const { error } = await supabase.from('sources').insert({
      user_id: user?.id,
      name: newSource.name,
      url: newSource.url,
      category: newSource.category,
    });

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Source ajoutée', description: `${newSource.name} a été ajoutée.` });
      setNewSource({ name: '', url: '', category: 'other' });
      fetchSources();
    }
    setAdding(false);
  };

  const deleteSource = async (id: string) => {
    const { error } = await supabase.from('sources').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setSources(sources.filter((s) => s.id !== id));
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('sources').update({ is_active: isActive }).eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setSources(sources.map((s) => (s.id === id ? { ...s, is_active: isActive } : s)));
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold">Ajouter une source</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sourceName">Nom</Label>
            <Input
              id="sourceName"
              placeholder="TechCrunch"
              value={newSource.name}
              onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">URL</Label>
            <Input
              id="sourceUrl"
              placeholder="https://techcrunch.com"
              value={newSource.url}
              onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-4 items-end">
          <div className="space-y-2 flex-1">
            <Label>Catégorie</Label>
            <Select
              value={newSource.category}
              onValueChange={(v) => setNewSource({ ...newSource, category: v as ArticleCategory })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addSource} disabled={adding || !newSource.name || !newSource.url}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Ajouter
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Vos sources ({sources.length})</h3>
        {sources.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">Aucune source configurée.</p>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-3 bg-card rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={source.is_active}
                    onCheckedChange={(checked) => toggleActive(source.id, checked)}
                  />
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{source.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-secondary rounded">
                    {CATEGORY_LABELS[source.category]}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteSource(source.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};