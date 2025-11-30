import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BlockConfig, Post, Template } from "@shared/schema-types";

export function usePageSave({
	isTemplate,
	data,
	onSave,
}: {
	isTemplate: boolean;
	data: Post | Template | undefined;
	onSave?: (updatedData: Post | Template) => void;
}) {
	const toast = useToast();
	const queryClient = useQueryClient();

	const saveMutation = useMutation({
		mutationFn: async (builderData: BlockConfig[]) => {
			if (!data) return null;

			// Prepare payload for logging
			let payload: any;
			let endpoint: string;

			if (isTemplate) {
				endpoint = `/api/templates/${data.id}`;
				payload = { blocks: builderData };
			} else {
				// Check if it's a page (has menuOrder property) or a post
				const isPage = "menuOrder" in data;
				endpoint = isPage ? `/api/pages/${data.id}` : `/api/posts/${data.id}`;
				payload = isPage
					? { blocks: builderData } // Pages use blocks field
					: { builderData, usePageBuilder: true }; // Posts use builderData
			}

			// Log what would be saved
			console.group(
				"🔍 PAGE BUILDER SAVE (usePageSave Hook) - BACKEND PAYLOAD (DISABLED)",
			);
			console.log("Is Template:", isTemplate);
			console.log("Is Page:", !isTemplate && "menuOrder" in data);
			console.log("Endpoint:", endpoint);
			console.log("Data ID:", data.id);
			console.log("Blocks Count:", builderData.length);
			console.log("Full Payload:", JSON.stringify(payload, null, 2));
			console.log("Blocks Array:", builderData);
			console.log(
				"Blocks Structure:",
				builderData.map((block, index) => ({
					index,
					id: block.id,
					name: block.name,
					settings: block.settings,
					children: block.children?.length || 0,
				})),
			);
			console.groupEnd();

			// BACKEND SAVE DISABLED - Original code commented out for debugging
			// if (isTemplate) {
			//   const response = await apiRequest('PUT', `/api/templates/${data.id}`, { blocks: builderData });
			//   return await response.json();
			// } else {
			//   const response = await apiRequest('PUT', endpoint, payload);
			//   return await response.json();
			// }

			// Simulate success by returning the data as if it was saved
			return { ...data, blocks: builderData, builderData } as any;
		},
		onSuccess: (updatedData) => {
			const isPage = !isTemplate && data && "menuOrder" in data;
			toast.toast({
				title: "Success",
				description: `${isTemplate ? "Template" : isPage ? "Page" : "Post"} saved successfully`,
			});
			onSave?.(updatedData);

			// Invalidate appropriate queries
			if (isTemplate) {
				queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
			} else if (isPage) {
				queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
			} else {
				queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
			}
		},
		onError: () => {
			const isPage = !isTemplate && data && "menuOrder" in data;
			toast.toast({
				title: "Error",
				description: `Failed to save ${isTemplate ? "template" : isPage ? "page" : "post"}`,
				variant: "destructive",
			});
		},
	});

	return saveMutation;
}
