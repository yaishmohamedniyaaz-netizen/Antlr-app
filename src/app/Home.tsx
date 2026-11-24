import { Navigate } from 'react-router'
import { defaultPathFor } from './nav'
import { useSettings } from '@/data/hooks'

/** Sends "/" to the main screen for this business type. */
export function Home() {
  return <Navigate to={defaultPathFor(useSettings().businessType)} replace />
}
