import { Info, CircleCheck, CircleAlert, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
	useDebouncedDomainVerify,
	hasBlockingDomainIssues,
	type DomainReadinessData,
} from "@/hooks/use-debounced-domain-verify";

export type DomainInputWithVerifyProps = {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	placeholder?: string;
	/** `domain` = bare hostname in setup; `siteUrl` = full URL in settings */
	inputMode?: "domain" | "siteUrl";
	className?: string;
	required?: boolean;
};

function DnsRows({ data }: { data: DomainReadinessData }) {
	return (
		<ul className="text-xs space-y-1 mt-1">
			{data.checkedHostnames.map((host) => {
				const row = data.dns[host];
				if (!row) return null;
				const ok = row.ok || row.skipped;
				return (
					<li key={host} className="flex items-start gap-1.5">
						{ok ? (
							<CircleCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
						) : (
							<CircleAlert className="h-3.5 w-3.5 shrink-0 text-red-600 mt-0.5" />
						)}
						<span>
							<span className="font-medium">{host}</span>
							{row.addresses.length > 0
								? ` → ${row.addresses.join(", ")}`
								: null}
							{row.message ? (
								<span className="text-muted-foreground"> — {row.message}</span>
							) : null}
						</span>
					</li>
				);
			})}
		</ul>
	);
}

function DomainSetupInstructions({ inputMode }: { inputMode: "domain" | "siteUrl" }) {
	return (
		<div className="space-y-3 text-sm text-muted-foreground max-w-sm">
			<p className="font-medium text-foreground">Point DNS at this server</p>
			<ol className="list-decimal pl-4 space-y-2">
				<li>
					In your DNS provider, add an <strong className="text-foreground">A</strong> record
					for the apex (e.g. <code className="text-xs bg-muted px-1 rounded">example.com</code>)
					to your server&apos;s public <strong className="text-foreground">IPv4</strong>.
				</li>
				<li>
					Add <code className="text-xs bg-muted px-1 rounded">www</code> as either an{" "}
					<strong className="text-foreground">A</strong> record to the same IP or a{" "}
					<strong className="text-foreground">CNAME</strong> to the apex. NextPress serves both
					apex and <code className="text-xs bg-muted px-1 rounded">www</code> on the same site.
				</li>
				<li>
					Wait for DNS to propagate (often a few minutes, sometimes up to TTL).
				</li>
				<li>
					Keep ports <strong className="text-foreground">80</strong> and{" "}
					<strong className="text-foreground">443</strong> open so Let&apos;s Encrypt can issue
					certificates.
				</li>
			</ol>
			<p>
				Optional: set <code className="text-xs bg-muted px-1 rounded">PUBLIC_IPV4</code> on the
				server so checks confirm DNS matches this machine. Caddy routing is probed from the app
				container (e.g. <code className="text-xs bg-muted px-1 rounded">CADDY_INTERNAL_URL</code>).
			</p>
			{inputMode === "siteUrl" ? (
				<p>
					Use a full URL including protocol, e.g.{" "}
					<code className="text-xs bg-muted px-1 rounded">https://example.com</code>.
				</p>
			) : (
				<p>
					Enter the bare hostname (e.g.{" "}
					<code className="text-xs bg-muted px-1 rounded">example.com</code>) — no{" "}
					<code className="text-xs bg-muted px-1 rounded">https://</code>.
				</p>
			)}
		</div>
	);
}

/**
 * Reusable domain / site URL field with debounced verification (DNS, optional IP match, Caddy probe)
 * and an info popover for DNS + TLS setup guidance.
 */
export function DomainInputWithVerify({
	id,
	label,
	value,
	onChange,
	disabled,
	placeholder,
	inputMode = "domain",
	className,
	required,
}: DomainInputWithVerifyProps) {
	const verify = useDebouncedDomainVerify(value);
	const borderIssue =
		verify.kind === "ready" && hasBlockingDomainIssues(verify.data);

	return (
		<div className={cn("space-y-2", className)}>
			<div className="flex items-center gap-2">
				<Label htmlFor={id} className="mb-0">
					{label}
				</Label>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-muted-foreground"
							aria-label="How to configure your domain"
							disabled={disabled}
						>
							<Info className="h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent align="start" className="w-auto max-w-md">
						<DomainSetupInstructions inputMode={inputMode} />
					</PopoverContent>
				</Popover>
			</div>

			<Input
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				disabled={disabled}
				required={required}
				autoComplete="off"
				className={cn(borderIssue && "border-red-500 focus-visible:ring-red-500/30")}
			/>

			<div className="min-h-[1.25rem] text-xs text-muted-foreground">
				{verify.kind === "idle" ? null : verify.kind === "verifying" ? (
					<span className="inline-flex items-center gap-2 text-foreground/80">
						<Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
						Verifying DNS, IP match, and reverse proxy…
					</span>
				) : verify.kind === "error" ? (
					<span className="text-red-600">{verify.message}</span>
				) : (
					<div className="space-y-2 rounded-md border border-border/80 bg-muted/30 p-2">
						<p className="font-medium text-foreground text-xs">
							{hasBlockingDomainIssues(verify.data) ? (
								<span className="text-amber-800 dark:text-amber-200">
									Some checks need attention
								</span>
							) : (
								<span className="text-emerald-800 dark:text-emerald-200">
									Checks passed
								</span>
							)}
						</p>
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
								DNS (A)
							</p>
							<DnsRows data={verify.data} />
						</div>
						<div className="flex items-start gap-1.5 text-xs">
							{verify.data.ipMatch.ok || verify.data.ipMatch.skipped ? (
								<CircleCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
							) : (
								<CircleAlert className="h-3.5 w-3.5 shrink-0 text-red-600 mt-0.5" />
							)}
							<span>
								<span className="font-medium text-foreground">IP match</span> —{" "}
								{verify.data.ipMatch.message}
							</span>
						</div>
						<div className="flex items-start gap-1.5 text-xs">
							{verify.data.caddy.ok ? (
								<CircleCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
							) : (
								<CircleAlert className="h-3.5 w-3.5 shrink-0 text-red-600 mt-0.5" />
							)}
							<span>
								<span className="font-medium text-foreground">Caddy / proxy</span> —{" "}
								{verify.data.caddy.message}
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
