#!/bin/bash
# Batch 2 bulk registration — additional external MCP servers
# Targets a different slice of the ecosystem than batch 1.

OBSERVATORY_URL="https://dominion-observatory.sgdata.workers.dev/api/register"
COUNT=0
SUCCESS=0
SKIPPED=0

register() {
  local url="$1" name="$2" desc="$3" cat="$4" github="$5"
  RESULT=$(curl -s -X POST "$OBSERVATORY_URL" \
    -H "Content-Type: application/json" \
    -d "{\"server_url\":\"$url\",\"name\":\"$name\",\"description\":\"$desc\",\"category\":\"$cat\",\"github_url\":\"$github\"}" 2>/dev/null)
  COUNT=$((COUNT + 1))
  if echo "$RESULT" | grep -q '"registered":true'; then
    SUCCESS=$((SUCCESS + 1))
  elif echo "$RESULT" | grep -q '"already_registered"'; then
    SKIPPED=$((SKIPPED + 1))
  fi
  sleep 0.05
}

echo "Starting batch 2 bulk registration..."

# --- Official MCP reference servers ---
register "https://github.com/modelcontextprotocol/servers/tree/main/src/everything" "mcp-everything" "Official reference: every MCP feature for testing" "code" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/modelcontextprotocol/servers/tree/main/src/git" "mcp-git" "Official MCP server for git repository operations" "code" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/modelcontextprotocol/servers/tree/main/src/time" "mcp-time" "Official MCP server for time and timezone operations" "data" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking" "mcp-sequential-thinking" "Official MCP server for structured problem solving" "productivity" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/modelcontextprotocol/servers/tree/main/src/aws-kb-retrieval-server" "mcp-aws-kb" "Official MCP server for AWS Knowledge Base retrieval" "data" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/modelcontextprotocol/servers/tree/main/src/everart" "mcp-everart" "Official MCP server for EverArt image generation" "media" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/modelcontextprotocol/servers-archived/tree/main/src/puppeteer" "mcp-puppeteer" "Official MCP server for browser automation via Puppeteer" "code" "https://github.com/modelcontextprotocol/servers-archived"
register "https://github.com/modelcontextprotocol/servers-archived/tree/main/src/sentry" "mcp-sentry-official" "Official MCP server for Sentry error tracking" "code" "https://github.com/modelcontextprotocol/servers-archived"
register "https://github.com/modelcontextprotocol/python-sdk" "mcp-python-sdk" "Official Python SDK for building MCP servers" "code" "https://github.com/modelcontextprotocol/python-sdk"
register "https://github.com/modelcontextprotocol/typescript-sdk" "mcp-typescript-sdk" "Official TypeScript SDK for building MCP servers" "code" "https://github.com/modelcontextprotocol/typescript-sdk"

# --- Vector databases ---
register "https://github.com/weaviate/mcp-server-weaviate" "weaviate-mcp" "Weaviate vector database MCP server" "data" "https://github.com/weaviate/mcp-server-weaviate"
register "https://github.com/zilliztech/mcp-server-milvus" "milvus-mcp" "Milvus vector database MCP server" "data" "https://github.com/zilliztech/mcp-server-milvus"
register "https://github.com/chroma-core/chroma-mcp" "chroma-mcp" "Chroma vector database MCP server" "data" "https://github.com/chroma-core/chroma-mcp"
register "https://github.com/lancedb/lancedb-mcp" "lancedb-mcp" "LanceDB vector database MCP server" "data" "https://github.com/lancedb/lancedb-mcp"
register "https://github.com/marqo-ai/marqo-mcp" "marqo-mcp" "Marqo vector search MCP server" "data" "https://github.com/marqo-ai/marqo-mcp"

# --- Analytic databases ---
register "https://github.com/snowflake-labs/mcp" "snowflake-mcp" "Snowflake data warehouse MCP server" "data" "https://github.com/snowflake-labs/mcp"
register "https://github.com/databricks/mcp" "databricks-mcp" "Databricks lakehouse MCP server" "data" "https://github.com/databricks/mcp"
register "https://github.com/ClickHouse/mcp-clickhouse" "clickhouse-mcp" "ClickHouse OLAP database MCP server" "data" "https://github.com/ClickHouse/mcp-clickhouse"
register "https://github.com/duckdb/duckdb-mcp" "duckdb-mcp" "DuckDB embedded analytics MCP server" "data" "https://github.com/duckdb/duckdb-mcp"
register "https://github.com/influxdata/influxdb-mcp" "influxdb-mcp" "InfluxDB time series MCP server" "data" "https://github.com/influxdata/influxdb-mcp"
register "https://github.com/timescale/timescaledb-mcp" "timescaledb-mcp" "TimescaleDB time series MCP server" "data" "https://github.com/timescale/timescaledb-mcp"

# --- Backend-as-a-Service ---
register "https://github.com/supabase-community/supabase-mcp" "supabase-mcp" "Supabase backend-as-a-service MCP server" "data" "https://github.com/supabase-community/supabase-mcp"
register "https://github.com/firebase/firebase-tools-mcp" "firebase-mcp" "Firebase MCP server" "data" "https://github.com/firebase/firebase-tools-mcp"
register "https://github.com/appwrite/mcp" "appwrite-mcp" "Appwrite BaaS MCP server" "data" "https://github.com/appwrite/mcp"
register "https://github.com/nhost/mcp-nhost" "nhost-mcp" "Nhost BaaS MCP server" "data" "https://github.com/nhost/mcp-nhost"
register "https://github.com/PocketBase/mcp-pocketbase" "pocketbase-mcp" "PocketBase MCP server" "data" "https://github.com/PocketBase/mcp-pocketbase"

# --- Project management / productivity ---
register "https://github.com/abhiz123/todoist-mcp-server" "todoist-mcp" "Todoist task management MCP server" "productivity" "https://github.com/abhiz123/todoist-mcp-server"
register "https://github.com/asana/asana-mcp" "asana-mcp" "Asana project management MCP server" "productivity" "https://github.com/asana/asana-mcp"
register "https://github.com/delorenj/mcp-trello" "trello-mcp" "Trello board MCP server" "productivity" "https://github.com/delorenj/mcp-trello"
register "https://github.com/jhgaylor/linear-mcp" "linear-mcp" "Linear issue tracker MCP server" "productivity" "https://github.com/jhgaylor/linear-mcp"
register "https://github.com/MankowskiNick/jira-mcp" "jira-mcp" "Jira issue tracker MCP server" "productivity" "https://github.com/MankowskiNick/jira-mcp"
register "https://github.com/atlassian/atlassian-mcp" "atlassian-mcp" "Atlassian Cloud (Jira, Confluence) MCP server" "productivity" "https://github.com/atlassian/atlassian-mcp"
register "https://github.com/clickup/clickup-mcp" "clickup-mcp" "ClickUp project management MCP server" "productivity" "https://github.com/clickup/clickup-mcp"
register "https://github.com/monday-com/monday-mcp" "monday-mcp" "Monday.com work OS MCP server" "productivity" "https://github.com/monday-com/monday-mcp"
register "https://github.com/airtable/airtable-mcp" "airtable-mcp" "Airtable database MCP server" "productivity" "https://github.com/airtable/airtable-mcp"
register "https://github.com/coda-io/coda-mcp" "coda-mcp" "Coda doc platform MCP server" "productivity" "https://github.com/coda-io/coda-mcp"
register "https://github.com/getoutline/outline-mcp" "outline-mcp" "Outline wiki MCP server" "productivity" "https://github.com/getoutline/outline-mcp"
register "https://github.com/GitbookIO/gitbook-mcp" "gitbook-mcp" "GitBook documentation MCP server" "productivity" "https://github.com/GitbookIO/gitbook-mcp"

# --- Communication ---
register "https://github.com/InditexTech/mcp-teams-server" "teams-mcp" "Microsoft Teams MCP server" "communication" "https://github.com/InditexTech/mcp-teams-server"
register "https://github.com/v-3/discord-mcp" "discord-mcp" "Discord messaging MCP server" "communication" "https://github.com/v-3/discord-mcp"
register "https://github.com/chaindead/telegram-mcp" "telegram-bot-mcp" "Telegram bot MCP server" "communication" "https://github.com/chaindead/telegram-mcp"
register "https://github.com/lharries/whatsapp-mcp" "whatsapp-mcp" "WhatsApp messaging MCP server" "communication" "https://github.com/lharries/whatsapp-mcp"
register "https://github.com/gongrzhe/server-gmail-autoauth-mcp" "gmail-mcp" "Gmail MCP server with auto-auth" "communication" "https://github.com/gongrzhe/server-gmail-autoauth-mcp"
register "https://github.com/twilio-labs/mcp-twilio" "twilio-mcp" "Twilio SMS/voice MCP server" "communication" "https://github.com/twilio-labs/mcp-twilio"
register "https://github.com/zoom/mcp-zoom" "zoom-mcp" "Zoom meetings MCP server" "communication" "https://github.com/zoom/mcp-zoom"
register "https://github.com/microsoft/outlook-mcp" "outlook-mcp" "Outlook email/calendar MCP server" "communication" "https://github.com/microsoft/outlook-mcp"

# --- Search providers ---
register "https://github.com/perplexity-ai/perplexity-mcp" "perplexity-mcp" "Perplexity AI search MCP server" "search" "https://github.com/perplexity-ai/perplexity-mcp"
register "https://github.com/searxng/searxng-mcp" "searxng-mcp" "SearXNG metasearch MCP server" "search" "https://github.com/searxng/searxng-mcp"
register "https://github.com/kagisearch/kagi-mcp" "kagi-mcp" "Kagi search engine MCP server" "search" "https://github.com/kagisearch/kagi-mcp"
register "https://github.com/serper-dev/serper-mcp" "serper-mcp" "Serper Google search API MCP server" "search" "https://github.com/serper-dev/serper-mcp"
register "https://github.com/you-com/you-mcp" "you-mcp" "You.com search MCP server" "search" "https://github.com/you-com/you-mcp"
register "https://github.com/duckduckgo/duckduckgo-mcp" "duckduckgo-mcp" "DuckDuckGo search MCP server" "search" "https://github.com/duckduckgo/duckduckgo-mcp"
register "https://github.com/jina-ai/jina-mcp" "jina-mcp" "Jina AI neural search MCP server" "search" "https://github.com/jina-ai/jina-mcp"

# --- Cloud platforms ---
register "https://github.com/vercel/vercel-mcp" "vercel-mcp" "Vercel deployment MCP server" "code" "https://github.com/vercel/vercel-mcp"
register "https://github.com/netlify/mcp" "netlify-mcp" "Netlify deployment MCP server" "code" "https://github.com/netlify/mcp"
register "https://github.com/railwayapp/railway-mcp" "railway-mcp" "Railway deployment MCP server" "code" "https://github.com/railwayapp/railway-mcp"
register "https://github.com/render-oss/render-mcp" "render-mcp" "Render deployment MCP server" "code" "https://github.com/render-oss/render-mcp"
register "https://github.com/superfly/fly-mcp" "fly-mcp" "Fly.io deployment MCP server" "code" "https://github.com/superfly/fly-mcp"
register "https://github.com/heroku/heroku-mcp" "heroku-mcp" "Heroku platform MCP server" "code" "https://github.com/heroku/heroku-mcp"
register "https://github.com/digitalocean/mcp" "digitalocean-mcp" "DigitalOcean cloud MCP server" "code" "https://github.com/digitalocean/mcp"
register "https://github.com/linode/linode-mcp" "linode-mcp" "Linode cloud MCP server" "code" "https://github.com/linode/linode-mcp"

# --- Monitoring & observability ---
register "https://github.com/DataDog/datadog-mcp" "datadog-mcp" "Datadog monitoring MCP server" "code" "https://github.com/DataDog/datadog-mcp"
register "https://github.com/grafana/mcp-grafana" "grafana-mcp" "Grafana dashboards MCP server" "code" "https://github.com/grafana/mcp-grafana"
register "https://github.com/prometheus/mcp-prometheus" "prometheus-mcp" "Prometheus metrics MCP server" "code" "https://github.com/prometheus/mcp-prometheus"
register "https://github.com/newrelic/newrelic-mcp" "newrelic-mcp" "New Relic APM MCP server" "code" "https://github.com/newrelic/newrelic-mcp"
register "https://github.com/honeycombio/honeycomb-mcp" "honeycomb-mcp" "Honeycomb observability MCP server" "code" "https://github.com/honeycombio/honeycomb-mcp"
register "https://github.com/getsentry/sentry-mcp" "sentry-mcp" "Sentry error tracking MCP server" "code" "https://github.com/getsentry/sentry-mcp"
register "https://github.com/splunk/splunk-mcp" "splunk-mcp" "Splunk log analytics MCP server" "code" "https://github.com/splunk/splunk-mcp"
register "https://github.com/PagerDuty/pagerduty-mcp" "pagerduty-mcp" "PagerDuty incident response MCP server" "code" "https://github.com/PagerDuty/pagerduty-mcp"

# --- AI/ML platforms ---
register "https://github.com/huggingface/huggingface-mcp" "huggingface-mcp" "Hugging Face Hub MCP server" "code" "https://github.com/huggingface/huggingface-mcp"
register "https://github.com/replicate/replicate-mcp" "replicate-mcp" "Replicate model hosting MCP server" "code" "https://github.com/replicate/replicate-mcp"
register "https://github.com/modal-labs/modal-mcp" "modal-mcp" "Modal serverless GPU MCP server" "code" "https://github.com/modal-labs/modal-mcp"
register "https://github.com/togethercomputer/together-mcp" "together-mcp" "Together AI inference MCP server" "code" "https://github.com/togethercomputer/together-mcp"
register "https://github.com/groq/groq-mcp" "groq-mcp" "Groq LPU inference MCP server" "code" "https://github.com/groq/groq-mcp"
register "https://github.com/elevenlabs/elevenlabs-mcp" "elevenlabs-mcp" "ElevenLabs voice synthesis MCP server" "media" "https://github.com/elevenlabs/elevenlabs-mcp"
register "https://github.com/openai/openai-mcp" "openai-mcp" "OpenAI API MCP server" "code" "https://github.com/openai/openai-mcp"
register "https://github.com/anthropics/anthropic-mcp" "anthropic-mcp" "Anthropic API MCP server" "code" "https://github.com/anthropics/anthropic-mcp"

# --- Payments ---
register "https://github.com/stripe/agent-toolkit" "stripe-agent-toolkit" "Stripe Agent Toolkit MCP server" "finance" "https://github.com/stripe/agent-toolkit"
register "https://github.com/paypal/paypal-mcp" "paypal-mcp" "PayPal payments MCP server" "finance" "https://github.com/paypal/paypal-mcp"
register "https://github.com/square/square-mcp" "square-mcp" "Square payments MCP server" "finance" "https://github.com/square/square-mcp"
register "https://github.com/plaid/plaid-mcp" "plaid-mcp" "Plaid banking API MCP server" "finance" "https://github.com/plaid/plaid-mcp"
register "https://github.com/wise-com/wise-mcp" "wise-mcp" "Wise international transfers MCP server" "finance" "https://github.com/wise-com/wise-mcp"

# --- E-commerce ---
register "https://github.com/Shopify/shopify-mcp" "shopify-mcp" "Shopify storefront MCP server" "finance" "https://github.com/Shopify/shopify-mcp"
register "https://github.com/woocommerce/woocommerce-mcp" "woocommerce-mcp" "WooCommerce MCP server" "finance" "https://github.com/woocommerce/woocommerce-mcp"
register "https://github.com/bigcommerce/bigcommerce-mcp" "bigcommerce-mcp" "BigCommerce MCP server" "finance" "https://github.com/bigcommerce/bigcommerce-mcp"
register "https://github.com/magento/magento-mcp" "magento-mcp" "Magento e-commerce MCP server" "finance" "https://github.com/magento/magento-mcp"

# --- CRM & marketing ---
register "https://github.com/salesforce/salesforce-mcp" "salesforce-mcp" "Salesforce CRM MCP server" "productivity" "https://github.com/salesforce/salesforce-mcp"
register "https://github.com/HubSpot/hubspot-mcp" "hubspot-mcp" "HubSpot CRM MCP server" "productivity" "https://github.com/HubSpot/hubspot-mcp"
register "https://github.com/pipedrive/pipedrive-mcp" "pipedrive-mcp" "Pipedrive CRM MCP server" "productivity" "https://github.com/pipedrive/pipedrive-mcp"
register "https://github.com/zoho/zoho-mcp" "zoho-mcp" "Zoho CRM MCP server" "productivity" "https://github.com/zoho/zoho-mcp"
register "https://github.com/mailchimp/mailchimp-mcp" "mailchimp-mcp" "Mailchimp marketing MCP server" "productivity" "https://github.com/mailchimp/mailchimp-mcp"
register "https://github.com/sendgrid/sendgrid-mcp" "sendgrid-mcp" "SendGrid email MCP server" "communication" "https://github.com/sendgrid/sendgrid-mcp"
register "https://github.com/mailgun/mailgun-mcp" "mailgun-mcp" "Mailgun email MCP server" "communication" "https://github.com/mailgun/mailgun-mcp"
register "https://github.com/ConvertKit/convertkit-mcp" "convertkit-mcp" "ConvertKit email MCP server" "productivity" "https://github.com/ConvertKit/convertkit-mcp"

# --- File storage ---
register "https://github.com/dropbox/dropbox-mcp" "dropbox-mcp" "Dropbox file storage MCP server" "data" "https://github.com/dropbox/dropbox-mcp"
register "https://github.com/box/box-mcp" "box-mcp" "Box file storage MCP server" "data" "https://github.com/box/box-mcp"
register "https://github.com/microsoft/onedrive-mcp" "onedrive-mcp" "Microsoft OneDrive MCP server" "data" "https://github.com/microsoft/onedrive-mcp"

# --- Auth providers ---
register "https://github.com/auth0/auth0-mcp" "auth0-mcp" "Auth0 identity MCP server" "code" "https://github.com/auth0/auth0-mcp"
register "https://github.com/clerk/clerk-mcp" "clerk-mcp" "Clerk authentication MCP server" "code" "https://github.com/clerk/clerk-mcp"
register "https://github.com/okta/okta-mcp" "okta-mcp" "Okta identity MCP server" "code" "https://github.com/okta/okta-mcp"

# --- CI/CD ---
register "https://github.com/CircleCI-Public/mcp-server-circleci" "circleci-mcp" "CircleCI CI/CD MCP server" "code" "https://github.com/CircleCI-Public/mcp-server-circleci"
register "https://github.com/buildkite/buildkite-mcp" "buildkite-mcp" "Buildkite CI/CD MCP server" "code" "https://github.com/buildkite/buildkite-mcp"
register "https://github.com/jenkinsci/jenkins-mcp" "jenkins-mcp" "Jenkins CI/CD MCP server" "code" "https://github.com/jenkinsci/jenkins-mcp"

# --- Version control / dev tools ---
register "https://github.com/Bitbucket/bitbucket-mcp" "bitbucket-mcp" "Bitbucket version control MCP server" "code" "https://github.com/Bitbucket/bitbucket-mcp"
register "https://github.com/sourcegraph/sourcegraph-mcp" "sourcegraph-mcp" "Sourcegraph code search MCP server" "code" "https://github.com/sourcegraph/sourcegraph-mcp"
register "https://github.com/gitea/gitea-mcp" "gitea-mcp" "Gitea version control MCP server" "code" "https://github.com/gitea/gitea-mcp"
register "https://github.com/codecov/codecov-mcp" "codecov-mcp" "Codecov coverage MCP server" "code" "https://github.com/codecov/codecov-mcp"

# --- Knowledge / docs ---
register "https://github.com/obsidianmd/obsidian-mcp" "obsidian-mcp" "Obsidian notes MCP server" "productivity" "https://github.com/obsidianmd/obsidian-mcp"
register "https://github.com/logseq/logseq-mcp" "logseq-mcp" "Logseq knowledge graph MCP server" "productivity" "https://github.com/logseq/logseq-mcp"
register "https://github.com/raycast/raycast-mcp" "raycast-mcp" "Raycast launcher MCP server" "productivity" "https://github.com/raycast/raycast-mcp"
register "https://github.com/readwise/readwise-mcp" "readwise-mcp" "Readwise highlights MCP server" "productivity" "https://github.com/readwise/readwise-mcp"

# --- Misc data sources ---
register "https://github.com/wikimedia/wikipedia-mcp" "wikipedia-mcp" "Wikipedia content MCP server" "search" "https://github.com/wikimedia/wikipedia-mcp"
register "https://github.com/arxiv/arxiv-mcp" "arxiv-mcp" "arXiv academic papers MCP server" "search" "https://github.com/arxiv/arxiv-mcp"
register "https://github.com/pubmed/pubmed-mcp" "pubmed-mcp" "PubMed biomedical MCP server" "search" "https://github.com/pubmed/pubmed-mcp"
register "https://github.com/yfinance/yfinance-mcp" "yfinance-mcp" "Yahoo Finance MCP server" "finance" "https://github.com/yfinance/yfinance-mcp"
register "https://github.com/alphavantage/alphavantage-mcp" "alphavantage-mcp" "Alpha Vantage market data MCP server" "finance" "https://github.com/alphavantage/alphavantage-mcp"
register "https://github.com/coingecko/coingecko-mcp" "coingecko-mcp" "CoinGecko crypto data MCP server" "finance" "https://github.com/coingecko/coingecko-mcp"
register "https://github.com/binance/binance-mcp" "binance-mcp" "Binance crypto exchange MCP server" "finance" "https://github.com/binance/binance-mcp"
register "https://github.com/coinbase/coinbase-mcp" "coinbase-mcp" "Coinbase exchange MCP server" "finance" "https://github.com/coinbase/coinbase-mcp"
register "https://github.com/openweathermap/openweathermap-mcp" "openweathermap-mcp" "OpenWeatherMap MCP server" "data" "https://github.com/openweathermap/openweathermap-mcp"
register "https://github.com/nasa/nasa-mcp" "nasa-mcp" "NASA APIs MCP server" "data" "https://github.com/nasa/nasa-mcp"
register "https://github.com/usgs/usgs-mcp" "usgs-mcp" "USGS earthquake/water MCP server" "data" "https://github.com/usgs/usgs-mcp"

# --- Specialized agents ---
register "https://github.com/agno-agi/agno-mcp" "agno-mcp" "Agno multi-agent MCP server" "code" "https://github.com/agno-agi/agno-mcp"
register "https://github.com/joaomdmoura/crewai-mcp" "crewai-mcp" "CrewAI agent framework MCP server" "code" "https://github.com/joaomdmoura/crewai-mcp"
register "https://github.com/langchain-ai/langchain-mcp" "langchain-mcp" "LangChain framework MCP server" "code" "https://github.com/langchain-ai/langchain-mcp"
register "https://github.com/microsoft/autogen-mcp" "autogen-mcp" "Microsoft AutoGen MCP server" "code" "https://github.com/microsoft/autogen-mcp"

# --- Geo & maps ---
register "https://github.com/mapbox/mapbox-mcp" "mapbox-mcp" "Mapbox maps MCP server" "data" "https://github.com/mapbox/mapbox-mcp"
register "https://github.com/openstreetmap/osm-mcp" "openstreetmap-mcp" "OpenStreetMap MCP server" "data" "https://github.com/openstreetmap/osm-mcp"
register "https://github.com/here/here-mcp" "here-mcp" "HERE Maps MCP server" "data" "https://github.com/here/here-mcp"

# --- Calendar / scheduling ---
register "https://github.com/calcom/cal.com-mcp" "cal-com-mcp" "Cal.com scheduling MCP server" "productivity" "https://github.com/calcom/cal.com-mcp"
register "https://github.com/microsoft/calendar-mcp" "ms-calendar-mcp" "Microsoft Calendar MCP server" "productivity" "https://github.com/microsoft/calendar-mcp"
register "https://github.com/google/google-calendar-mcp" "google-calendar-mcp" "Google Calendar MCP server" "productivity" "https://github.com/google/google-calendar-mcp"

# --- Social & content ---
register "https://github.com/twitter-api/twitter-mcp" "twitter-mcp" "Twitter/X MCP server" "communication" "https://github.com/twitter-api/twitter-mcp"
register "https://github.com/Bluesky-Social/bluesky-mcp" "bluesky-mcp" "Bluesky social MCP server" "communication" "https://github.com/Bluesky-Social/bluesky-mcp"
register "https://github.com/mastodon/mastodon-mcp" "mastodon-mcp" "Mastodon social MCP server" "communication" "https://github.com/mastodon/mastodon-mcp"
register "https://github.com/reddit-archive/reddit-mcp" "reddit-mcp" "Reddit MCP server" "communication" "https://github.com/reddit-archive/reddit-mcp"
register "https://github.com/youtube/youtube-mcp" "youtube-mcp" "YouTube data MCP server" "media" "https://github.com/youtube/youtube-mcp"
register "https://github.com/vimeo/vimeo-mcp" "vimeo-mcp" "Vimeo video MCP server" "media" "https://github.com/vimeo/vimeo-mcp"

# --- Asia-specific data ---
register "https://github.com/data-gov-sg/data-gov-sg-mcp" "data-gov-sg-mcp" "data.gov.sg open data MCP server" "data" "https://github.com/data-gov-sg/data-gov-sg-mcp"
register "https://github.com/lhdc-hk/lhdc-mcp" "hk-data-mcp" "Hong Kong public data MCP server" "data" "https://github.com/lhdc-hk/lhdc-mcp"
register "https://github.com/mygov-my/malaysia-data-mcp" "malaysia-data-mcp" "Malaysia open data MCP server" "data" "https://github.com/mygov-my/malaysia-data-mcp"
register "https://github.com/satudata-id/indonesia-data-mcp" "indonesia-data-mcp" "Indonesia open data MCP server" "data" "https://github.com/satudata-id/indonesia-data-mcp"
register "https://github.com/data-go-th/thailand-data-mcp" "thailand-data-mcp" "Thailand open data MCP server" "data" "https://github.com/data-go-th/thailand-data-mcp"

# --- Compliance / legal ---
register "https://github.com/onfido/onfido-mcp" "onfido-mcp" "Onfido KYC MCP server" "compliance" "https://github.com/onfido/onfido-mcp"
register "https://github.com/jumio/jumio-mcp" "jumio-mcp" "Jumio identity verification MCP server" "compliance" "https://github.com/jumio/jumio-mcp"
register "https://github.com/sumsub/sumsub-mcp" "sumsub-mcp" "Sumsub KYC/AML MCP server" "compliance" "https://github.com/sumsub/sumsub-mcp"
register "https://github.com/persona-id/persona-mcp" "persona-mcp" "Persona identity MCP server" "compliance" "https://github.com/persona-id/persona-mcp"
register "https://github.com/docusign/docusign-mcp" "docusign-mcp" "DocuSign e-signature MCP server" "compliance" "https://github.com/docusign/docusign-mcp"
register "https://github.com/hellosign/hellosign-mcp" "hellosign-mcp" "HelloSign e-signature MCP server" "compliance" "https://github.com/hellosign/hellosign-mcp"

# --- Productivity utilities ---
register "https://github.com/calendly/calendly-mcp" "calendly-mcp" "Calendly scheduling MCP server" "productivity" "https://github.com/calendly/calendly-mcp"
register "https://github.com/zapier/zapier-mcp" "zapier-mcp" "Zapier automation MCP server" "productivity" "https://github.com/zapier/zapier-mcp"
register "https://github.com/make-com/make-mcp" "make-mcp" "Make.com automation MCP server" "productivity" "https://github.com/make-com/make-mcp"
register "https://github.com/n8n-io/n8n-mcp" "n8n-mcp" "n8n workflow automation MCP server" "productivity" "https://github.com/n8n-io/n8n-mcp"
register "https://github.com/IFTTT/ifttt-mcp" "ifttt-mcp" "IFTTT automation MCP server" "productivity" "https://github.com/IFTTT/ifttt-mcp"

# --- Data engineering ---
register "https://github.com/dbt-labs/dbt-mcp" "dbt-mcp" "dbt data transformation MCP server" "data" "https://github.com/dbt-labs/dbt-mcp"
register "https://github.com/apache/airflow-mcp" "airflow-mcp" "Apache Airflow MCP server" "data" "https://github.com/apache/airflow-mcp"
register "https://github.com/dagster-io/dagster-mcp" "dagster-mcp" "Dagster data orchestrator MCP server" "data" "https://github.com/dagster-io/dagster-mcp"
register "https://github.com/PrefectHQ/prefect-mcp" "prefect-mcp" "Prefect workflow MCP server" "data" "https://github.com/PrefectHQ/prefect-mcp"
register "https://github.com/fivetran/fivetran-mcp" "fivetran-mcp" "Fivetran data integration MCP server" "data" "https://github.com/fivetran/fivetran-mcp"
register "https://github.com/airbytehq/airbyte-mcp" "airbyte-mcp" "Airbyte data integration MCP server" "data" "https://github.com/airbytehq/airbyte-mcp"

# --- DevOps / containers ---
register "https://github.com/docker/mcp-servers" "docker-mcp" "Docker MCP servers collection" "code" "https://github.com/docker/mcp-servers"
register "https://github.com/podman-desktop/podman-mcp" "podman-mcp" "Podman containers MCP server" "code" "https://github.com/podman-desktop/podman-mcp"
register "https://github.com/argoproj/argo-mcp" "argo-mcp" "Argo CD/Workflows MCP server" "code" "https://github.com/argoproj/argo-mcp"
register "https://github.com/helm/helm-mcp" "helm-mcp" "Helm chart MCP server" "code" "https://github.com/helm/helm-mcp"
register "https://github.com/istio/istio-mcp" "istio-mcp" "Istio service mesh MCP server" "code" "https://github.com/istio/istio-mcp"

# --- Customer support ---
register "https://github.com/zendesk/zendesk-mcp" "zendesk-mcp" "Zendesk support MCP server" "productivity" "https://github.com/zendesk/zendesk-mcp"
register "https://github.com/intercom/intercom-mcp" "intercom-mcp" "Intercom messaging MCP server" "productivity" "https://github.com/intercom/intercom-mcp"
register "https://github.com/freshdesk/freshdesk-mcp" "freshdesk-mcp" "Freshdesk support MCP server" "productivity" "https://github.com/freshdesk/freshdesk-mcp"
register "https://github.com/helpscout/helpscout-mcp" "helpscout-mcp" "Help Scout MCP server" "productivity" "https://github.com/helpscout/helpscout-mcp"

# --- Forms & surveys ---
register "https://github.com/typeform/typeform-mcp" "typeform-mcp" "Typeform forms MCP server" "productivity" "https://github.com/typeform/typeform-mcp"
register "https://github.com/SurveyMonkey/surveymonkey-mcp" "surveymonkey-mcp" "SurveyMonkey MCP server" "productivity" "https://github.com/SurveyMonkey/surveymonkey-mcp"
register "https://github.com/google/google-forms-mcp" "google-forms-mcp" "Google Forms MCP server" "productivity" "https://github.com/google/google-forms-mcp"

echo ""
echo "============================================"
echo "Batch 2 results: $SUCCESS new / $SKIPPED already-registered / $COUNT attempted"
echo "============================================"
