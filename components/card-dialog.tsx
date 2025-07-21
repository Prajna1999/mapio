import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ReactNode } from "react"

interface CardDialogProps {
    trigger: ReactNode
    title: string
    description?: string
    children?: ReactNode
    actions?: ReactNode
    className?: string
    showCancel?: boolean
    cancelText?: string
    onSubmit?: (e: React.FormEvent) => void
}

export function CardDialog({
    trigger,
    title,
    description,
    children,
    actions,
    className = "sm:max-w-[640px] !p-3",
    showCancel = true,
    cancelText = "Cancel",
    onSubmit
}: CardDialogProps) {
    return (
        <Dialog>
            <form onSubmit={onSubmit}>
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
                <DialogContent className={className}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {description && (
                            <DialogDescription>
                                {description}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <div className="flex gap-4">
                        {children}
                    </div>
                    <DialogFooter>
                        {showCancel && (
                            <DialogClose asChild>
                                <Button variant="outline">{cancelText}</Button>
                            </DialogClose>
                        )}
                        {actions}
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    )
}
