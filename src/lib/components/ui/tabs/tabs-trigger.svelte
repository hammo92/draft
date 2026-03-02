<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border border-transparent px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-all",
		"text-muted-foreground hover:text-foreground",
		"data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:border-accent/50 data-[state=active]:shadow-[0_0_10px_rgba(0,212,255,0.2)]",
		"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
		"disabled:pointer-events-none disabled:opacity-50",
		"[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		className
	)}
	{...restProps}
/>
