import { useParams } from 'react-router-dom';
import { AppHeader } from '@/components/layout/app-header';

export default function CollectionDetailPage() {
  const { id } = useParams();

  return (
    <div>
      <AppHeader title="Collection" showBack />
      <div className="px-5 py-4">
        <p className="text-muted-foreground text-sm">Collection {id} coming in Phase 3...</p>
      </div>
    </div>
  );
}
