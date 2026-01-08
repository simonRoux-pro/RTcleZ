import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Keyword } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Loader2 } from 'lucide-react';

export const KeywordsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setKeywords(data as Keyword[]);
    }
    setLoading(false);
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;
    setAdding(true);

    const { error } = await supabase.from('keywords').insert({
      user_id: user?.id,
      keyword: newKeyword.trim().toLowerCase(),
    });

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Mot-clé ajouté' });
      setNewKeyword('');
      fetchKeywords();
    }
    setAdding(false);
  };

  const deleteKeyword = async (id: string) => {
    const { error } = await supabase.from('keywords').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setKeywords(keywords.filter((k) => k.id !== id));
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('keywords').update({ is_active: isActive }).eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setKeywords(keywords.map((k) => (k.id === id ? { ...k, is_active: isActive } : k)));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addKeyword();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold">Ajouter un mot-clé</h3>
        <p className="text-sm text-muted-foreground">
          Les articles contenant ces mots-clés seront mis en avant.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="intelligence artificielle"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={addKeyword} disabled={adding || !newKeyword.trim()}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Ajouter
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Vos mots-clés ({keywords.length})</h3>
        {keywords.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">Aucun mot-clé configuré.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Badge
                key={keyword.id}
                variant={keyword.is_active ? 'default' : 'secondary'}
                className="py-2 px-3 text-sm gap-2 cursor-pointer"
                onClick={() => toggleActive(keyword.id, !keyword.is_active)}
              >
                {keyword.keyword}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteKeyword(keyword.id);
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};