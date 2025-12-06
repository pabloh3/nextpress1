import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BlockConfig, Page, Post, Template } from "@shared/schema-types";
import { savePageDraft } from "@/lib/pageDraftStorage";

export function usePageSave({
	isTemplate,
	data,
	onSave,
	pageMeta,
}: {
	isTemplate: boolean;
	data: Post | Template | undefined;
	onSave?: (updatedData: Post | Template) => void;
	pageMeta?: {
		title?: string;
		slug?: string;
		status?: string;
		version?: number;
	};
}) {
	const toast = useToast();
	const queryClient = useQueryClient();

	const saveMutation = useMutation({
		mutationFn: async (builderData: BlockConfig[]) => {
			if (!data) return null;

			let payload: any;
			let endpoint: string;

			if (isTemplate) {
				endpoint = `/api/templates/${data.id}`;
				payload = { blocks: builderData };
			} else {
				const isPage = "menuOrder" in data;
				endpoint = isPage ? `/api/pages/${data.id}` : `/api/posts/${data.id}`;
				payload = isPage
					? {
							title: pageMeta?.title ?? (data as Page).title,
							slug: pageMeta?.slug ?? (data as Page).slug,
							status: pageMeta?.status ?? (data as Page).status,
							blocks: builderData,
							version: pageMeta?.version ?? (data as Page).version ?? 0,
					  }
					: { builderData, usePageBuilder: true };
			}

			const response = await apiRequest("PUT", endpoint, payload);
			return await response.json();
		},
		onSuccess: (updatedData) => {
			const isPage = !isTemplate && data && "menuOrder" in data;
			if (isPage && updatedData?.id) {
				savePageDraft(updatedData.id, updatedData as any);
			}

			toast.toast({
				title: "Success",
				description: `${isTemplate ? "Template" : isPage ? "Page" : "Post"} saved successfully`,
			});
			onSave?.(updatedData);

			if (isTemplate) {
				queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
				queryClient.invalidateQueries({ queryKey: [`/api/templates/${data?.id}`] });
			} else if (isPage) {
				queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
				queryClient.invalidateQueries({ queryKey: [`/api/pages/${data?.id}`] });
			} else {
				queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
				queryClient.invalidateQueries({ queryKey: [`/api/posts/${data?.id}`] });
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
