export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Data Platform",
  description:
    "Beautifully designed components built with Radix UI and Tailwind CSS.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
  ],
  links: {
    gcp: "https://console.cloud.google.com/bigquery",
    docs: "https://confluence.inside-box.net/display/DP/Data-Platform+User+Docs",
  },
}
