import { cn } from "@/lib/utils.ts"
import { Button } from "@/components/ui/button.tsx"
import { spotifyApi } from "@/api/apiClient.ts"
import { AudioWaveform } from "lucide-react";
import { ModeToggle } from "@/components/shadcn-composed/mode-toggle.tsx";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const handleSpotifyLogin = async () => {
    try {
      const { url } = await spotifyApi.login();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to initiate Spotify login:', error);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 text-primary", className)} {...props}>
      <form>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-24 items-center justify-center">
                <AudioWaveform className="w-12 h-12" />
              </div>
            </a>
            <div className="flex flex-row items-center gap-4">
              <h1 className="text-2xl font-bold">Welcome to tunedIn</h1>
              <ModeToggle />
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <Button 
              variant="outline" 
              type="button" 
              className="w-full"
              onClick={handleSpotifyLogin}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path
                  d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
                  fill="currentColor"
                />
              </svg>
              Continue with Spotify
            </Button>
          </div>
        </div>
      </form>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
