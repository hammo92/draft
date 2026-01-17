<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { MessageCircle } from "@lucide/svelte";
	import type { WeeklyBanter } from "$lib/types/fpl";

	let { banter }: { banter: WeeklyBanter | null } = $props();
</script>

{#if banter}
	<Card.Root class="bg-card border border-border rounded shadow-none">
		<Card.Header class="pb-2">
			<Card.Title class="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
				<MessageCircle class="w-5 h-5 text-accent" />
				GW{banter.gameweek} Round-Up
			</Card.Title>
		</Card.Header>
		<Card.Content class="pt-0">
			<blockquote class="border-l-4 border-accent pl-4 italic text-foreground/90 font-serif text-base leading-relaxed">
				"{banter.message}"
			</blockquote>
		</Card.Content>
	</Card.Root>
{/if}
