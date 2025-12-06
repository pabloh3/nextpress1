import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BlockConfig, Page } from "@shared/schema-types";
import { savePageDraft } from "@/lib/pageDraftStorage";

export function usePageSave({
	isTemplate,
	data,
	onSave,
	pageMeta,
}: {
	isTemplate: boolean;
	data: Page | undefined;
	onSave?: (updatedData: Page) => void;
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

			endpoint = `/api/pages/${data.id}`;
			payload = {
				title: pageMeta?.title ?? data.title,
				slug: pageMeta?.slug ?? data.slug,
				status: pageMeta?.status ?? data.status,
				blocks: builderData,
				version: pageMeta?.version ?? data.version ?? 0,
			};

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
