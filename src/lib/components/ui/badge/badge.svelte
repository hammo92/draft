<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-all focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-2.5",
		variants: {
			variant: {
				default:
					"bg-accent/20 text-accent border-accent/50 [a&]:hover:bg-accent/30",
				secondary:
					"bg-muted text-muted-foreground [a&]:hover:bg-muted/80 border-border",
				destructive:
					"bg-destructive/20 text-destructive border-destructive/50 [a&]:hover:bg-destructive/30",
				outline: "text-foreground border-border [a&]:hover:bg-muted [a&]:hover:text-accent",
				success:
					"bg-success/20 text-success border-success/50 [a&]:hover:bg-success/30",
				warning:
					"bg-warning/20 text-warning border-warning/50 [a&]:hover:bg-warning/30",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
