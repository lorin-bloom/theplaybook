/**
 * Public sources for the example playbook. Each was located via web search on
 * 2026-11-10 and the excerpt summarises what that page states (short quotes
 * only). Where a page blocked automated fetching, the excerpt notes that it was
 * confirmed via search-index text and should be re-checked before external use.
 */
export const DEMO_RETRIEVED = "2026-11-10";

export const DEMO_SOURCES = [
  {
    ref: "S1",
    title: "ChatGPT pricing — Business plan",
    url: "https://chatgpt.com/pricing/?type=team",
    publisher: "OpenAI (chatgpt.com)",
    publishedAt: null,
    topics: ["company", "product"],
    excerpt:
      "Business plan listed “For teams of 2–200 employees”; FAQ: plans are “available starting at 2 users.” Listed features include connecting to Google Workspace, Slack, GitHub, Microsoft 365 and more; a secure workspace with SAML SSO and MFA; centralized billing and administration; usage analytics and spend controls; and “No training on your business data by default.” Seat prices did not render in the retrieved text.",
  },
  {
    ref: "S2",
    title: "ChatGPT Business rename FAQ",
    url: "https://help.openai.com/en/articles/12111915-chatgpt-business-rename-faq",
    publisher: "OpenAI Help Center",
    publishedAt: "2025-08-29",
    topics: ["company", "product"],
    excerpt:
      "ChatGPT Team was renamed ChatGPT Business as of August 29, 2025. The FAQ describes it as a name change only — features, pricing and limits unchanged — and says business data is excluded from training by default and encrypted in transit and at rest. (Confirmed via search-index text; the page blocked automated fetching.)",
  },
  {
    ref: "S3",
    title: "Introducing Microsoft 365 Copilot Business: Empowering Small and Medium Businesses with AI",
    url: "https://techcommunity.microsoft.com/t5/microsoft-365-copilot-blog/introducing-microsoft-365-copilot-business-empowering-small-and/ba-p/4469700",
    publisher: "Microsoft Tech Community",
    publishedAt: "2025-11-18",
    topics: ["competitor", "audience"],
    excerpt:
      "Microsoft announced Copilot Business “priced at a competitive $21 per user per month,” available worldwide December 1, 2025, for customers with a Microsoft 365 Business plan and fewer than 300 users. Positioned as built for small and medium businesses, under the framing “For SMBs, every dollar counts.”",
  },
  {
    ref: "S4",
    title: "Google Workspace drops Gemini add-on charge, raises business, enterprise plan prices",
    url: "https://www.constellationr.com/insights/news/google-workspace-drops-gemini-add-charge-raises-business-enterprise-plan-prices",
    publisher: "Constellation Research (Larry Dignan)",
    publishedAt: "2025-01-15",
    topics: ["competitor", "media"],
    excerpt:
      "Google said Workspace “will include Gemini for its business and enterprise plans,” dropping separate add-on charges. A Business Standard customer previously paying $32/user/month with the Gemini add-on would pay $14 — $2 more than Workspace without Gemini. Existing-customer price changes took effect March 17, 2025.",
  },
  {
    ref: "S5",
    title: "2025 Empowering Small Business Report",
    url: "https://www.uschamber.com/technology/empowering-small-business-the-impact-of-technology-on-u-s-small-business",
    publisher: "U.S. Chamber of Commerce Technology Engagement Center",
    publishedAt: "2025-08-18",
    topics: ["audience", "metrics"],
    excerpt:
      "58% of U.S. small businesses self-identified as using generative AI in 2025, up from 40% in 2024 and 23% in 2023. The report says barriers to adoption persist; 82% of AI-using small businesses reported increasing their workforce over the past year.",
  },
  {
    ref: "S6",
    title: "OpenAI Launches ‘Company Knowledge’ for ChatGPT",
    url: "https://www.maginative.com/article/openai-launches-company-knowledge-for-chatgpt/",
    publisher: "Maginative",
    publishedAt: "2025-10-23",
    topics: ["product", "media", "competitor"],
    excerpt:
      "OpenAI rolled out company knowledge for ChatGPT Business, Enterprise and Edu users, letting ChatGPT reason over work sources such as Slack, SharePoint, Google Drive and GitHub and give cited answers. The article notes the feature “raises questions around data governance” and trust in LLM-based internal answers.",
  },
  {
    ref: "S7",
    title: "HubSpot launches first CRM deep research connector with ChatGPT",
    url: "https://www.hubspot.com/company-news/hubspot-deep-research-connector-for-chatgpt",
    publisher: "HubSpot",
    publishedAt: "2025-06-04",
    topics: ["partner", "marketing", "audience"],
    excerpt:
      "HubSpot announced a deep research connector letting ChatGPT users query HubSpot CRM data (deals, companies, contacts, tickets; read-only). HubSpot cited its own customer survey finding more than 75% of HubSpot customers already use ChatGPT, and said customer data is not used for AI training in ChatGPT.",
  },
  {
    ref: "S8",
    title: "Ad of the Day: OpenAI’s first global ChatGPT campaign shows everyday use cases",
    url: "https://www.thedrum.com/news/2025/09/29/ad-the-day-openai-s-first-global-chatgpt-campaign-shows-everyday-use-cases",
    publisher: "The Drum",
    publishedAt: "2025-09-29",
    topics: ["marketing", "company"],
    excerpt:
      "Trade coverage of OpenAI’s first major ChatGPT brand campaign, showing everyday personal tasks such as planning workouts and cooking, running across TV, streaming, out-of-home, paid social and influencer partnerships. (Confirmed via search-index text; page body did not render for automated fetching.)",
  },
  {
    ref: "S9",
    title: "AI adoption among small businesses surges 41% in 2025 according to new survey from Thryv",
    url: "https://www.silicon.co.uk/press-release/ai-adoption-among-small-businesses-surges-41-in-2025-according-to-new-survey-from-thryv",
    publisher: "Thryv (press release via Silicon UK)",
    publishedAt: "2025-05",
    topics: ["audience", "metrics"],
    excerpt:
      "Thryv’s survey of 540 small-business decision-makers reported current AI usage rising from 39% (2024) to 55% (2025); among firms with 10–100 employees, usage rose from 47% to 68%. (Vendor-sponsored survey; confirmed via search-index text.)",
  },
  {
    ref: "S10",
    title: "OpenAI Brings Everyday Stories to Screen in First-Ever Campaign for ChatGPT",
    url: "https://news.designrush.com/openai-chatgpt-brand-campaign-isle-of-any-miles-jay",
    publisher: "DesignRush News",
    publishedAt: "2025-09",
    topics: ["marketing"],
    excerpt:
      "Coverage reports the campaign films were directed by Miles Jay and created with independent agency Isle of Any, with spots including “Pull-Up with ChatGPT” and “Dish with ChatGPT.” (Confirmed via search-index text.)",
  },
  {
    ref: "S11",
    title: "Jeff Su — YouTube channel",
    url: "https://www.youtube.com/@JeffSu",
    publisher: "YouTube",
    publishedAt: null,
    topics: ["marketing", "partner"],
    excerpt:
      "Productivity creator publishing concise AI and workplace how-tos, including multiple ChatGPT-for-work tutorials (e.g. “Top 5 ChatGPT Use Cases for Professionals”). Third-party profiles describe him as a former Google product marketing manager. Audience size not verified here.",
  },
  {
    ref: "S12",
    title: "What is the Claude Team plan?",
    url: "https://support.claude.com/en/articles/9266767-what-is-the-claude-team-plan",
    publisher: "Anthropic Help Center",
    publishedAt: null,
    topics: ["competitor"],
    excerpt:
      "Anthropic’s help center describes a self-serve Team plan for small teams with admin controls — a comparable seat-based offer in the same segment. (Seat pricing and minimums vary across secondary sources and were not verified here.)",
  },
] as const;
