import { LogOut as LogOutIcon } from "lucide-react"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function LogOut() {
  // Use a separate state to control the dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  const handleLogout = () => {
    // Clear cookies and reload page
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    window.location.reload();
  }

  // Prevent event bubbling
  const openDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirmDialog(true);
  }

  return (
    <>
      {/* Regular button outside of dialog */}
      <button 
        onClick={openDialog} 
        className="w-full flex items-center"
        type="button"
      >
        <LogOutIcon className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </button>

      {/* Separate dialog controlled by state */}
      <AlertDialog 
        open={showConfirmDialog} 
        onOpenChange={setShowConfirmDialog}
      >
        <AlertDialogContent style={{ zIndex: 100, backgroundColor: 'white' }} className="!bg-white dark:!bg-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
