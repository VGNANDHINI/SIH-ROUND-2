
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useSopLibrary } from '@/firebase/firestore/hooks';
import type { SopLibraryItem } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Video, FileText, ImageIcon } from 'lucide-react';

const categories = ["Pumping", "Pipeline", "Chlorination", "Safety", "General O&M"];

const FileTypeIcon = ({ type }: { type: SopLibraryItem['fileType'] }) => {
  switch (type) {
    case 'video': return <Video className="h-5 w-5 text-red-500" />;
    case 'pdf': return <FileText className="h-5 w-5 text-blue-500" />;
    case 'image': return <ImageIcon className="h-5 w-5 text-green-500" />;
    default: return null;
  }
};

export default function SopLibraryPage() {
  const { data: items, loading } = useSopLibrary();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SopLibraryItem | null>(null);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => {
      const categoryMatch = activeCategory ? item.category === activeCategory : true;
      const searchMatch = searchTerm.length > 2 ? 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      return categoryMatch && searchMatch;
    });
  }, [items, searchTerm, activeCategory]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Micro-learning &amp; SOP Library</CardTitle>
          <CardDescription>
            Find training materials, standard operating procedures, and safety checklists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search by title or tag (e.g., 'pump', 'safety')..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={!activeCategory ? 'default' : 'outline'}
              onClick={() => setActiveCategory(null)}
            >
              All
            </Button>
            {categories.map(category => (
              <Button 
                key={category} 
                variant={activeCategory === category ? 'default' : 'outline'}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? <p>Loading...</p> : filteredItems.map(item => (
          <Card key={item.id} className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedItem(item)}>
            <div className="relative w-full aspect-video">
              <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover rounded-t-lg"/>
            </div>
            <CardHeader className="flex-row gap-4 items-start">
                <FileTypeIcon type={item.fileType} />
                <div>
                    <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
                    <Badge variant="secondary" className="mt-2">{item.category}</Badge>
                </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            </CardContent>
          </Card>
        ))}
        {!loading && filteredItems.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-10">No items match your search.</p>
        )}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.title}</DialogTitle>
                <DialogDescription>{selectedItem.description}</DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0">
                {selectedItem.fileType === 'video' && (
                  <div className="aspect-video w-full">
                    <iframe
                      src={selectedItem.fileUrl}
                      title={selectedItem.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
                {selectedItem.fileType === 'image' && (
                  <div className="relative w-full h-full">
                    <Image src={selectedItem.fileUrl} alt={selectedItem.title} fill className="object-contain" />
                  </div>
                )}
                {selectedItem.fileType === 'pdf' && (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                     <FileText className="h-16 w-16 text-muted-foreground" />
                     <p className="text-muted-foreground">This is a PDF document.</p>
                     <Button asChild>
                        <a href={selectedItem.fileUrl} target="_blank" rel="noopener noreferrer">
                            Open PDF in New Tab
                        </a>
                     </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
