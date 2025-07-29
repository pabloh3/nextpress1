import { Template } from "@shared/schema";
import HomepageTemplate from "./HomepageTemplate";

interface TemplateRendererProps {
  template: Template;
  isPreview?: boolean;
}

export default function TemplateRenderer({ template, isPreview = false }: TemplateRendererProps) {
  // Route to the appropriate template component based on template name/type
  switch (template.name) {
    case "Homepage Dashboard":
    case "homepage":
    default:
      return <HomepageTemplate config={template.config} isPreview={isPreview} />;
  }
}