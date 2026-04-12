#!/bin/bash
# Bulk-register external MCP servers into the Dominion Observatory
# This script registers known MCP servers from the ecosystem
# to expand Observatory coverage from ~20 to 500+

OBSERVATORY_URL="https://dominion-observatory.sgdata.workers.dev/api/register"
COUNT=0
SUCCESS=0

register() {
  local url="$1" name="$2" desc="$3" cat="$4" github="$5"
  RESULT=$(curl -s -X POST "$OBSERVATORY_URL" \
    -H "Content-Type: application/json" \
    -d "{\"server_url\":\"$url\",\"name\":\"$name\",\"description\":\"$desc\",\"category\":\"$cat\",\"github_url\":\"$github\"}" 2>/dev/null)
  COUNT=$((COUNT + 1))
  if echo "$RESULT" | grep -q '"registered":true'; then
    SUCCESS=$((SUCCESS + 1))
  fi
  # Rate limit: 50ms delay between requests
  sleep 0.05
}

echo "Starting bulk registration to Dominion Observatory..."

# --- Browser Automation ---
register "https://github.com/microsoft/playwright-mcp" "playwright-mcp" "Microsoft Playwright MCP server for browser automation" "code" "https://github.com/microsoft/playwright-mcp"
register "https://github.com/browsermcp/mcp" "browsermcp" "Browser MCP - browser automation for AI agents" "code" "https://github.com/browsermcp/mcp"
register "https://github.com/browserbase/mcp-server-browserbase" "browserbase-mcp" "Browserbase MCP server - cloud browser infrastructure" "code" "https://github.com/browserbase/mcp-server-browserbase"
register "https://github.com/executeautomation/mcp-playwright" "playwright-mcp-executeautomation" "Playwright MCP Server for browser testing" "code" "https://github.com/executeautomation/mcp-playwright"
register "https://github.com/Automata-Labs-team/MCP-Server-Playwright" "automata-playwright-mcp" "Automata Labs Playwright MCP Server" "code" "https://github.com/Automata-Labs-team/MCP-Server-Playwright"

# --- Cloud Platforms ---
register "https://github.com/awslabs/mcp" "aws-mcp" "AWS Labs MCP server for cloud operations" "code" "https://github.com/awslabs/mcp"
register "https://github.com/cloudflare/mcp-server-cloudflare" "cloudflare-mcp" "Cloudflare official MCP server" "code" "https://github.com/cloudflare/mcp-server-cloudflare"
register "https://github.com/hashicorp/terraform-mcp-server" "terraform-mcp" "HashiCorp Terraform MCP server for infrastructure" "code" "https://github.com/hashicorp/terraform-mcp-server"
register "https://github.com/pulumi/mcp-server" "pulumi-mcp" "Pulumi MCP server for infrastructure as code" "code" "https://github.com/pulumi/mcp-server"
register "https://github.com/localstack/localstack-mcp-server" "localstack-mcp" "LocalStack MCP server for local cloud dev" "code" "https://github.com/localstack/localstack-mcp-server"
register "https://github.com/Flux159/mcp-server-kubernetes" "k8s-mcp" "Kubernetes MCP server for cluster management" "code" "https://github.com/Flux159/mcp-server-kubernetes"
register "https://github.com/redis/mcp-redis-cloud" "redis-cloud-mcp" "Redis Cloud MCP server" "data" "https://github.com/redis/mcp-redis-cloud"
register "https://github.com/alexei-led/aws-mcp-server" "aws-ops-mcp" "AWS operations MCP server" "code" "https://github.com/alexei-led/aws-mcp-server"
register "https://github.com/aliyun/alibaba-cloud-ops-mcp-server" "alibaba-cloud-mcp" "Alibaba Cloud operations MCP" "code" "https://github.com/aliyun/alibaba-cloud-ops-mcp-server"

# --- Databases ---
register "https://github.com/modelcontextprotocol/servers" "mcp-sqlite" "Official MCP SQLite server" "data" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/kiliczsh/mcp-mongo-server" "mongodb-mcp" "MongoDB MCP server" "data" "https://github.com/kiliczsh/mcp-mongo-server"
register "https://github.com/ergut/mcp-bigquery-server" "bigquery-mcp" "Google BigQuery MCP server" "data" "https://github.com/ergut/mcp-bigquery-server"
register "https://github.com/crystaldba/postgres-mcp" "postgres-mcp" "PostgreSQL MCP server" "data" "https://github.com/crystaldba/postgres-mcp"
register "https://github.com/neo4j-contrib/mcp-neo4j" "neo4j-mcp" "Neo4j graph database MCP server" "data" "https://github.com/neo4j-contrib/mcp-neo4j"
register "https://github.com/qdrant/mcp-server-qdrant" "qdrant-mcp" "Qdrant vector database MCP server" "data" "https://github.com/qdrant/mcp-server-qdrant"
register "https://github.com/couchbase-examples/mcp-server-couchbase" "couchbase-mcp" "Couchbase MCP server" "data" "https://github.com/couchbase-examples/mcp-server-couchbase"
register "https://github.com/pinecone-io/pinecone-mcp" "pinecone-mcp" "Pinecone vector DB MCP server" "data" "https://github.com/pinecone-io/pinecone-mcp"
register "https://github.com/datastax/astra-db-mcp" "datastax-astra-mcp" "DataStax Astra DB MCP server" "data" "https://github.com/datastax/astra-db-mcp"

# --- Developer Tools ---
register "https://github.com/modelcontextprotocol/servers" "mcp-github" "Official GitHub MCP server" "code" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/modelcontextprotocol/servers" "mcp-gitlab" "Official GitLab MCP server" "code" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/modelcontextprotocol/servers" "mcp-slack" "Official Slack MCP server" "communication" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/modelcontextprotocol/servers" "mcp-google-drive" "Official Google Drive MCP server" "productivity" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/modelcontextprotocol/servers" "mcp-google-maps" "Official Google Maps MCP server" "data" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/modelcontextprotocol/servers" "mcp-filesystem" "Official filesystem MCP server" "code" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/modelcontextprotocol/servers" "mcp-memory" "Official memory MCP server" "productivity" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/modelcontextprotocol/servers" "mcp-fetch" "Official fetch MCP server" "code" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/modelcontextprotocol/servers" "mcp-brave-search" "Official Brave Search MCP server" "search" "https://github.com/modelcontextprotocol/servers"

# --- Communication ---
register "https://github.com/discourse/discourse-mcp" "discourse-mcp" "Discourse forum MCP server" "communication" "https://github.com/discourse/discourse-mcp"
register "https://github.com/elie222/inbox-zero" "inbox-zero-mcp" "Inbox Zero email MCP server" "communication" "https://github.com/elie222/inbox-zero"
register "https://github.com/chaindead/telegram-mcp" "telegram-mcp" "Telegram MCP server" "communication" "https://github.com/chaindead/telegram-mcp"

# --- Finance ---
register "https://github.com/anthropics/anthropic-tools" "stripe-mcp" "Stripe payments MCP server" "finance" "https://github.com/anthropics/anthropic-tools"
register "https://github.com/jasonwilbur/cloud-cost-mcp" "cloud-cost-mcp" "Cloud cost analysis MCP server" "finance" "https://github.com/jasonwilbur/cloud-cost-mcp"

# --- Search ---
register "https://github.com/tavily-ai/tavily-mcp" "tavily-mcp" "Tavily AI search MCP server" "search" "https://github.com/tavily-ai/tavily-mcp"
register "https://github.com/exa-labs/exa-mcp-server" "exa-mcp" "Exa search MCP server" "search" "https://github.com/exa-labs/exa-mcp-server"
register "https://github.com/pskill9/web-search" "web-search-mcp" "Web search MCP server" "search" "https://github.com/pskill9/web-search"

# --- Data & Analytics ---
register "https://github.com/tinybirdco/mcp-tinybird" "tinybird-mcp" "Tinybird analytics MCP server" "data" "https://github.com/tinybirdco/mcp-tinybird"
register "https://github.com/motherduckdb/mcp-server-motherduck" "motherduck-mcp" "MotherDuck analytics MCP server" "data" "https://github.com/motherduckdb/mcp-server-motherduck"
register "https://github.com/apify/mcp-server-apify" "apify-mcp" "Apify web scraping MCP server" "data" "https://github.com/apify/mcp-server-apify"
register "https://github.com/firecrawl/mcp-server-firecrawl" "firecrawl-mcp" "Firecrawl web scraping MCP server" "data" "https://github.com/firecrawl/mcp-server-firecrawl"

# --- Security ---
register "https://github.com/nicholasgriffintn/mcp-zap" "zap-mcp" "OWASP ZAP security scanning MCP" "compliance" "https://github.com/nicholasgriffintn/mcp-zap"
register "https://github.com/nicholasgriffintn/mcp-nuclei" "nuclei-mcp" "Nuclei vulnerability scanning MCP" "compliance" "https://github.com/nicholasgriffintn/mcp-nuclei"
register "https://github.com/nicholasgriffintn/mcp-trivy" "trivy-mcp" "Trivy container security MCP" "compliance" "https://github.com/nicholasgriffintn/mcp-trivy"
register "https://github.com/nicholasgriffintn/mcp-semgrep" "semgrep-mcp" "Semgrep code analysis MCP" "compliance" "https://github.com/nicholasgriffintn/mcp-semgrep"

# --- Productivity ---
register "https://github.com/modelcontextprotocol/servers" "mcp-notion" "MCP Notion server" "productivity" "https://github.com/modelcontextprotocol/servers"
register "https://github.com/liveblocks/liveblocks-mcp-server" "liveblocks-mcp" "Liveblocks collaboration MCP" "productivity" "https://github.com/liveblocks/liveblocks-mcp-server"
register "https://github.com/julien040/anyquery" "anyquery-mcp" "Anyquery SQL MCP server" "data" "https://github.com/julien040/anyquery"

# --- Aggregators & Meta ---
register "https://github.com/1mcp-app/agent" "1mcp-agent" "1MCP agent aggregator" "code" "https://github.com/1mcp-app/agent"
register "https://github.com/metatool-ai/metatool-app" "metatool-mcp" "Metatool AI meta-MCP" "code" "https://github.com/metatool-ai/metatool-app"
register "https://github.com/PipedreamHQ/pipedream" "pipedream-mcp" "Pipedream workflow automation MCP" "code" "https://github.com/PipedreamHQ/pipedream"
register "https://github.com/wegotdocs/open-mcp" "open-mcp" "Open MCP toolkit" "code" "https://github.com/wegotdocs/open-mcp"

# --- Biology & Medicine ---
register "https://github.com/genomoncology/biomcp" "biomcp" "BioMCP biomedical research MCP" "data" "https://github.com/genomoncology/biomcp"
register "https://github.com/the-momentum/fhir-mcp-server" "fhir-mcp" "FHIR health data MCP server" "data" "https://github.com/the-momentum/fhir-mcp-server"

# --- Art & Culture ---
register "https://github.com/ahujasid/blender-mcp" "blender-mcp" "Blender 3D MCP server" "code" "https://github.com/ahujasid/blender-mcp"
register "https://github.com/mikechao/metmuseum-mcp" "metmuseum-mcp" "Metropolitan Museum MCP server" "data" "https://github.com/mikechao/metmuseum-mcp"
register "https://github.com/r-huijts/rijksmuseum-mcp" "rijksmuseum-mcp" "Rijksmuseum MCP server" "data" "https://github.com/r-huijts/rijksmuseum-mcp"

# --- Code Execution ---
register "https://github.com/dagger/container-use" "container-use-mcp" "Dagger container execution MCP" "code" "https://github.com/dagger/container-use"
register "https://github.com/pydantic/pydantic-ai" "pydantic-run-python-mcp" "Pydantic AI Python execution MCP" "code" "https://github.com/pydantic/pydantic-ai"
register "https://github.com/yepcode/mcp-server-js" "yepcode-mcp" "YepCode execution MCP" "code" "https://github.com/yepcode/mcp-server-js"

# --- Architecture & Design ---
register "https://github.com/erajasekar/ai-diagram-maker-mcp" "diagram-maker-mcp" "AI diagram maker MCP" "productivity" "https://github.com/erajasekar/ai-diagram-maker-mcp"
register "https://github.com/GittyBurstein/mermaid-mcp-server" "mermaid-mcp" "Mermaid diagram MCP server" "productivity" "https://github.com/GittyBurstein/mermaid-mcp-server"

# --- More popular servers from ecosystem ---
register "https://github.com/strowk/mcp-k8s-go" "k8s-go-mcp" "Kubernetes Go MCP server" "code" "https://github.com/strowk/mcp-k8s-go"
register "https://github.com/rohitg00/kubectl-mcp-server" "kubectl-mcp" "Kubectl MCP server" "code" "https://github.com/rohitg00/kubectl-mcp-server"
register "https://github.com/TencentCloudBase/CloudBase-AI-ToolKit" "tencent-cloud-mcp" "Tencent Cloud AI toolkit MCP" "code" "https://github.com/TencentCloudBase/CloudBase-AI-ToolKit"
register "https://github.com/portainer/portainer-mcp" "portainer-mcp" "Portainer container management MCP" "code" "https://github.com/portainer/portainer-mcp"
register "https://github.com/espressif/esp-rainmaker-mcp" "esp-rainmaker-mcp" "ESP Rainmaker IoT MCP" "code" "https://github.com/espressif/esp-rainmaker-mcp"
register "https://github.com/aashari/mcp-server-aws-sso" "aws-sso-mcp" "AWS SSO MCP server" "code" "https://github.com/aashari/mcp-server-aws-sso"
register "https://github.com/sevalla-hosting/mcp" "sevalla-mcp" "Sevalla hosting MCP" "code" "https://github.com/sevalla-hosting/mcp"
register "https://github.com/kestra-io/mcp-server-python" "kestra-mcp" "Kestra workflow MCP" "code" "https://github.com/kestra-io/mcp-server-python"
register "https://github.com/cyclops-ui/mcp-cyclops" "cyclops-mcp" "Cyclops Kubernetes UI MCP" "code" "https://github.com/cyclops-ui/mcp-cyclops"
register "https://github.com/weibaohui/k8m" "k8m-mcp" "K8M Kubernetes management MCP" "code" "https://github.com/weibaohui/k8m"

# --- Communication extra ---
register "https://github.com/AbdelStark/nostr-mcp" "nostr-mcp" "Nostr protocol MCP server" "communication" "https://github.com/AbdelStark/nostr-mcp"
register "https://github.com/gitmotion/ntfy-me-mcp" "ntfy-mcp" "Ntfy notification MCP" "communication" "https://github.com/gitmotion/ntfy-me-mcp"
register "https://github.com/conarti/mattermost-mcp" "mattermost-mcp" "Mattermost MCP server" "communication" "https://github.com/conarti/mattermost-mcp"
register "https://github.com/codefuturist/email-mcp" "email-mcp" "Email MCP server" "communication" "https://github.com/codefuturist/email-mcp"

# --- More repos from awesome list ---
register "https://github.com/samuelgursky/davinci-resolve-mcp" "davinci-resolve-mcp" "DaVinci Resolve video editing MCP" "productivity" "https://github.com/samuelgursky/davinci-resolve-mcp"
register "https://github.com/burningion/video-editing-mcp" "video-editing-mcp" "Video editing MCP server" "productivity" "https://github.com/burningion/video-editing-mcp"
register "https://github.com/8enSmith/mcp-open-library" "open-library-mcp" "Open Library MCP server" "data" "https://github.com/8enSmith/mcp-open-library"
register "https://github.com/gupta-kush/spotify-mcp" "spotify-mcp" "Spotify MCP server" "productivity" "https://github.com/gupta-kush/spotify-mcp"
register "https://github.com/longevity-genie/biothings-mcp" "biothings-mcp" "BioThings genomics MCP" "data" "https://github.com/longevity-genie/biothings-mcp"
register "https://github.com/longevity-genie/gget-mcp" "gget-mcp" "gget genomics MCP" "data" "https://github.com/longevity-genie/gget-mcp"
register "https://github.com/JamesANZ/medical-mcp" "medical-mcp" "Medical data MCP server" "data" "https://github.com/JamesANZ/medical-mcp"
register "https://github.com/wso2/fhir-mcp-server" "wso2-fhir-mcp" "WSO2 FHIR health MCP" "data" "https://github.com/wso2/fhir-mcp-server"

# --- Coding Agents ---
register "https://github.com/ezyang/codemcp" "codemcp" "CodeMCP agent server" "code" "https://github.com/ezyang/codemcp"
register "https://github.com/wonderwhy-er/DesktopCommanderMCP" "desktop-commander-mcp" "Desktop Commander MCP" "code" "https://github.com/wonderwhy-er/DesktopCommanderMCP"
register "https://github.com/oraios/serena" "serena-mcp" "Serena code agent MCP" "code" "https://github.com/oraios/serena"
register "https://github.com/stippi/code-assistant" "code-assistant-mcp" "Code Assistant MCP" "code" "https://github.com/stippi/code-assistant"
register "https://github.com/preflight-dev/preflight" "preflight-mcp" "Preflight testing MCP" "code" "https://github.com/preflight-dev/preflight"

# --- IoT ---
register "https://github.com/IO-Aerospace-software-engineering/mcp-server" "aerospace-mcp" "IO Aerospace MCP server" "data" "https://github.com/IO-Aerospace-software-engineering/mcp-server"
register "https://github.com/gregario/astronomy-oracle" "astronomy-oracle-mcp" "Astronomy Oracle MCP" "data" "https://github.com/gregario/astronomy-oracle"

# --- Popular from ecosystem ---
register "https://github.com/co-browser/browser-use-mcp-server" "browser-use-mcp" "Browser Use MCP server" "code" "https://github.com/co-browser/browser-use-mcp-server"
register "https://github.com/webdriverio/mcp" "webdriverio-mcp" "WebdriverIO browser MCP" "code" "https://github.com/webdriverio/mcp"
register "https://github.com/lightpanda-io/gomcp" "lightpanda-mcp" "Lightpanda Go MCP" "code" "https://github.com/lightpanda-io/gomcp"
register "https://github.com/mindsdb/mindsdb" "mindsdb-mcp" "MindsDB AI database MCP" "data" "https://github.com/mindsdb/mindsdb"

echo ""
echo "=== Bulk Registration Complete ==="
echo "Total attempted: $COUNT"
echo "Successful: $SUCCESS"
