import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"
import { useEffect, useState } from "react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const [position, setPosition] = useState<"top-right" | "bottom-right">("bottom-right")

  // Detect mobile screen size and set position accordingly
  useEffect(() => {
    const handleResize = () => {
      // Consider mobile if width is less than 768px (typical tablet breakpoint)
      if (window.innerWidth < 768) {
        setPosition("top-right")
      } else {
        setPosition("bottom-right")
      }
    }

    // Set initial position
    handleResize()

    // Add event listener for window resize
    window.addEventListener("resize", handleResize)

    // Clean up event listener
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={position}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
