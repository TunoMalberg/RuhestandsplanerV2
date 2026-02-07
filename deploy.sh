#!/bin/bash
# ===========================================
# Automatisches Deployment Script
# Ruhestandsplanung App -> Google Cloud Run
# ===========================================

# Farben für Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "============================================"
echo "  Ruhestandsplanung App - Cloud Run Deploy"
echo "============================================"
echo -e "${NC}"

# Konfiguration
SERVICE_NAME="ruhestandsplanung"
REGION="${REGION:-europe-west1}"

echo -e "${YELLOW}[1/4] Überprüfe Google Cloud Konfiguration...${NC}"

# Prüfe ob gcloud installiert ist
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Fehler: gcloud CLI ist nicht installiert.${NC}"
    echo "Bitte installieren Sie es von: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Prüfe ob angemeldet
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo -e "${RED}Fehler: Sie sind nicht bei Google Cloud angemeldet.${NC}"
    echo "Bitte führen Sie aus: gcloud auth login"
    exit 1
fi

# Zeige aktuelle Konfiguration
PROJECT_ID=$(gcloud config get-value project)
echo -e "Projekt: ${GREEN}$PROJECT_ID${NC}"
echo -e "Region: ${GREEN}$REGION${NC}"
echo -e "Service: ${GREEN}$SERVICE_NAME${NC}"
echo ""

echo -e "${YELLOW}[2/4] Aktiviere notwendige APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com --quiet

echo ""
echo -e "${YELLOW}[3/4] Starte Deployment (dies dauert 5-10 Minuten)...${NC}"
echo ""

gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${YELLOW}[4/4] Deployment erfolgreich!${NC}"
    echo ""
    
    # Hole Service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")
    
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  DEPLOYMENT ABGESCHLOSSEN!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "Ihre App ist jetzt verfügbar unter:"
    echo ""
    echo -e "  ${GREEN}$SERVICE_URL${NC}"
    echo ""
    echo -e "============================================"
else
    echo ""
    echo -e "${RED}============================================${NC}"
    echo -e "${RED}  DEPLOYMENT FEHLGESCHLAGEN${NC}"
    echo -e "${RED}============================================${NC}"
    echo ""
    echo "Bitte überprüfen Sie die Fehlermeldungen oben."
    exit 1
fi