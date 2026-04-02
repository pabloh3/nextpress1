import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BlockConfig, Page, Post } from "@shared/schema-types";
import { savePageDraft } from "@/lib/pageDraftStorage";

type SaveContentType = "page" | "post";

function getEntityLabel(isTemplate: boolean, contentType: SaveContentType) {
	if (isTemplate) return "Template";
	return contentType === "post" ? "Post" : "Page";
}

export function usePageSave({
	isTemplate,
	data,
	onSave,
	pageMeta,
	contentType = "page",
}: {
	isTemplate: boolean;
	data: Page | Post | undefined;
	onSave?: (updatedData: Page | Post) => void;
	pageMeta?: {
		title?: string;
		slug?: string;
		status?: string;
		version?: number;
		other?: Record<string, unknown>;
	};
	contentType?: SaveContentType;
}) {
	const toast = useToast();
	const queryClient = useQueryClient();

	const saveMutation = useMutation({
		mutationFn: async (builderData: BlockConfig[]) => {
			if (!data) return null;

			let payload: any;
			let endpoint: string;

			endpoint = contentType === "post" ? `/api/posts/${data.id}` : `/api/pages/${data.id}`;
			payload = {
				title: pageMeta?.title ?? data.title,
				slug: pageMeta?.slug ?? data.slug,
				status: pageMeta?.status ?? data.status,
				blocks: builderData,
			};

			if (contentType === "page") {
				payload.version = pageMeta?.version ?? (data as Page).version ?? 0;
			}

			if (pageMeta?.other) {
				payload.other = pageMeta.other;
			}

			const response = await apiRequest("PUT", endpoint, payload);
			return await response.json();
		},
		onSuccess: (updatedData) => {
			const isPage = !isTemplate && contentType === "page";
			if (isPage && updatedData?.id) {
				savePageDraft(updatedData.id, updatedData as any);
			}

			toast.toast({
				title: "Success",
				description: `${getEntityLabel(isTemplate, contentType)} saved successfully`,
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
			toast.toast({
				title: "Error",
				description: `Failed to save ${getEntityLabel(isTemplate, contentType).toLowerCase()}`,
				variant: "destructive",
			});
		},
	});

	return saveMutation;
}
