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
	useDomainVerify,
	hasBlockingDomainIssues,
	type DomainReadinessData,
} from "@/hooks/use-domain-verify";

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
			<p className="font-medium text-foreground">Connect your domain</p>
			<ol className="list-decimal pl-4 space-y-2">
				<li>
					In your domain provider settings, point your main domain (for example{" "}
					<code className="text-xs bg-muted px-1 rounded">example.com</code>) to this
					server&apos;s public internet address.
				</li>
				<li>
					Point <code className="text-xs bg-muted px-1 rounded">www</code> to the same address,
					or create an alias to your main domain. Both can open the same site.
				</li>
				<li>
					Changes can take a little time to apply everywhere.
				</li>
				<li>
					Keep standard web traffic allowed so HTTPS certificates can be issued and renewed.
				</li>
			</ol>
			<p>
				If results look wrong, confirm your domain points to this host, wait a short while, and
				try again.
			</p>
			{inputMode === "siteUrl" ? (
				<p>
					Use a full address including protocol, for example{" "}
					<code className="text-xs bg-muted px-1 rounded">https://example.com</code>.
				</p>
			) : (
				<p>
					Enter your domain alone, for example{" "}
					<code className="text-xs bg-muted px-1 rounded">example.com</code>, without{" "}
					<code className="text-xs bg-muted px-1 rounded">https://</code>.
				</p>
			)}
		</div>
	);
}

/**
 * Domain or site URL field with readiness checks after blur and short setup guidance in the info
 * popover.
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
	const { state: verify, verify: runVerify, reset: resetVerify } = useDomainVerify();
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
							aria-label="How to connect your domain"
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
				onChange={(e) => {
					resetVerify();
					onChange(e.target.value);
				}}
				onBlur={() => {
					runVerify(value);
				}}
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
						Checking your domain…
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
								Domain records
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
								<span className="font-medium text-foreground">Points here</span>,{" "}
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
								<span className="font-medium text-foreground">Secure site</span>,{" "}
								{verify.data.caddy.message}
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
