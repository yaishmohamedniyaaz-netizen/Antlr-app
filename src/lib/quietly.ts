import { toast } from 'sonner'
import { errorMessage } from '@/hooks/useSave'

/** For small saves with no button to show progress on (hide, reorder, rename): show a toast if it fails. */
export function quietly(p: Promise<unknown>): void {
  p.catch((e) => toast.error(errorMessage(e)))
}
