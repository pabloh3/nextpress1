import type { ReactNode } from "react";

type BrandedFormLayoutProps = {
	children: ReactNode;
};

/**
 * Shared shell for auth and setup: soft backdrop and logo from `client/public/logo.svg`.
 */
export function BrandedFormLayout({ children }: BrandedFormLayoutProps) {
	return (
		<div className="relative min-h-screen flex flex-col items-center justify-center gap-6 p-4 sm:p-8 bg-gradient-to-b from-slate-50 via-background to-muted/50 dark:from-background dark:via-background dark:to-muted/25">
			<div
				className="pointer-events-none absolute inset-0 overflow-hidden"
				aria-hidden
			>
				<div className="absolute -top-32 left-1/2 h-56 w-[min(90vw,36rem)] -translate-x-1/2 rounded-full bg-muted-foreground/[0.06] blur-3xl dark:bg-muted-foreground/[0.12]" />
			</div>
			<div className="relative z-[1] flex w-full max-w-md flex-col items-center gap-5">
				<img
					src="/logo.svg"
					alt="NextPress"
					width={200}
					height={44}
					className="h-10 w-auto select-none drop-shadow-sm"
					decoding="async"
				/>
				{children}
			</div>
		</div>
	);
}
