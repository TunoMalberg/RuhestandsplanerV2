# Deployment-Anleitung: Ruhestandsplanung App auf Google Cloud Run

Diese Anleitung erklärt Schritt für Schritt, wie Sie die Ruhestandsplanung-App auf Google Cloud Run bereitstellen.

---

## Voraussetzungen

Bevor Sie beginnen, benötigen Sie:

1. **Google-Konto** (Gmail-Adresse)
2. **Kreditkarte** (für Google Cloud - es gibt ein Gratis-Kontingent von $300)
3. **Computer** mit Windows, Mac oder Linux

---

## Teil 1: Google Cloud Konto einrichten

### Schritt 1.1: Google Cloud Console öffnen

1. Öffnen Sie Ihren Browser
2. Gehen Sie zu: **https://console.cloud.google.com**
3. Melden Sie sich mit Ihrem Google-Konto an

### Schritt 1.2: Kostenloses Testguthaben aktivieren

1. Beim ersten Besuch werden Sie gefragt, ob Sie das kostenlose Testguthaben ($300) nutzen möchten
2. Klicken Sie auf **"Kostenlos starten"**
3. Wählen Sie Ihr Land (Österreich/Deutschland)
4. Akzeptieren Sie die Nutzungsbedingungen
5. Geben Sie Ihre Zahlungsdaten ein (wird nur bei Überschreitung belastet)

### Schritt 1.3: Neues Projekt erstellen

1. Klicken Sie oben links auf das Projekt-Dropdown (neben "Google Cloud")
2. Klicken Sie auf **"Neues Projekt"**
3. Name: `ruhestandsplanung` (oder ein anderer Name)
4. Klicken Sie auf **"Erstellen"**
5. Warten Sie, bis das Projekt erstellt wurde
6. Wählen Sie das neue Projekt aus dem Dropdown aus

---

## Teil 2: Google Cloud Shell verwenden (Einfachste Methode)

Die einfachste Methode ist die Verwendung der Cloud Shell - keine Installation auf Ihrem Computer nötig!

### Schritt 2.1: Cloud Shell öffnen

1. In der Google Cloud Console, klicken Sie oben rechts auf das **Terminal-Symbol** (Cloud Shell aktivieren)
2. Ein Terminal-Fenster öffnet sich am unteren Bildschirmrand
3. Warten Sie, bis "Welcome to Cloud Shell!" erscheint

### Schritt 2.2: Projekt-Dateien hochladen

**Option A: Über Cloud Shell Upload**

1. Klicken Sie auf die **drei Punkte (⋮)** oben rechts im Cloud Shell Fenster
2. Wählen Sie **"Hochladen"**
3. Laden Sie den gesamten `retirement-planner` Ordner als ZIP-Datei hoch
4. Entpacken Sie die Datei:
   ```bash
   unzip retirement-planner.zip
   cd retirement-planner
   ```

**Option B: Über Git (falls das Projekt in GitHub ist)**

```bash
git clone https://github.com/IHR-BENUTZERNAME/retirement-planner.git
cd retirement-planner
```

---

## Teil 3: Cloud Run APIs aktivieren

In der Cloud Shell, führen Sie folgende Befehle aus:

```bash
# Aktiviere notwendige APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Bestätige die Aktivierung
echo "APIs wurden aktiviert!"
```

---

## Teil 4: App auf Cloud Run deployen

### Schritt 4.1: Automatisches Deployment (Empfohlen)

Der einfachste Weg - ein einziger Befehl:

```bash
# Wechseln Sie in das Projekt-Verzeichnis
cd retirement-planner

# Deployment mit einem Befehl
gcloud run deploy ruhestandsplanung \
  --source . \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated
```

**Während des Deployments:**
- Bei der Frage "Do you want to continue?" tippen Sie `Y` und drücken Enter
- Das Deployment dauert ca. 5-10 Minuten
- Am Ende erscheint Ihre URL!

### Schritt 4.2: URL notieren

Nach erfolgreichem Deployment sehen Sie:

```
Service [ruhestandsplanung] revision [...] has been deployed and is serving 
100 percent of traffic.
Service URL: https://ruhestandsplanung-xxxxx-ew.a.run.app
```

Diese URL ist Ihre öffentliche Webadresse!

---

## Teil 5: Eigene Domain einrichten (Optional)

Falls Sie eine eigene Domain möchten (z.B. `ruhestand.schelhammer-capital.at`):

### Schritt 5.1: Domain-Mapping

1. Gehen Sie zu: **Cloud Run** in der Cloud Console
2. Klicken Sie auf Ihren Service (`ruhestandsplanung`)
3. Klicken Sie auf **"Domains verwalten"**
4. Klicken Sie auf **"Zuordnung hinzufügen"**
5. Wählen Sie **"Benutzerdefinierte Domain"**
6. Geben Sie Ihre Domain ein

### Schritt 5.2: DNS-Einträge bei Ihrem Domain-Anbieter

Sie erhalten von Google DNS-Einträge, die Sie bei Ihrem Domain-Anbieter eintragen müssen:

1. Melden Sie sich bei Ihrem Domain-Anbieter an (z.B. GoDaddy, Namecheap, World4You)
2. Gehen Sie zu DNS-Einstellungen
3. Fügen Sie die von Google angegebenen Einträge hinzu:
   - Typ: `A` oder `CNAME`
   - Name: Ihre Subdomain oder `@` für Hauptdomain
   - Wert: Der von Google angezeigte Wert

4. Warten Sie 10-30 Minuten (manchmal bis zu 24 Stunden)

---

## Teil 6: App aktualisieren

Wenn Sie Änderungen an der App vornehmen möchten:

```bash
# In das Projekt-Verzeichnis wechseln
cd retirement-planner

# Änderungen hochladen (gleicher Befehl wie beim ersten Deployment)
gcloud run deploy ruhestandsplanung \
  --source . \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated
```

---

## Teil 7: Kosten verstehen

### Kostenloses Kontingent (dauerhaft)
- **2 Millionen Anfragen** pro Monat kostenlos
- **360.000 GB-Sekunden** Speicher kostenlos
- **180.000 vCPU-Sekunden** kostenlos

### Geschätzte Kosten bei normaler Nutzung
- **Kleine Nutzung** (< 1000 Besucher/Monat): **KOSTENLOS**
- **Mittlere Nutzung** (< 10.000 Besucher/Monat): ca. **$1-5/Monat**
- **Hohe Nutzung** (< 100.000 Besucher/Monat): ca. **$10-30/Monat**

### Budget-Alarm einrichten
1. Gehen Sie zu: **Abrechnung** > **Budgets & Benachrichtigungen**
2. Erstellen Sie ein Budget mit Alarm bei z.B. $10

---

## Fehlerbehebung

### Problem: "Permission denied"
```bash
# Projekt ID setzen
gcloud config set project IHRE-PROJEKT-ID
```

### Problem: "API not enabled"
```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
```

### Problem: "Build failed"
- Überprüfen Sie, ob alle Dateien vorhanden sind
- Stellen Sie sicher, dass `Dockerfile` und `package.json` existieren

### Logs ansehen
```bash
gcloud run logs read --service ruhestandsplanung --region europe-west1
```

---

## Schnellbefehle zum Kopieren

```bash
# === ALLES IN EINEM: Deployment-Script ===

# 1. APIs aktivieren
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com

# 2. Deployment starten
gcloud run deploy ruhestandsplanung \
  --source . \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated

# 3. Service-URL anzeigen
gcloud run services describe ruhestandsplanung --region europe-west1 --format="value(status.url)"
```

---

## Alternative Regionen

Falls `europe-west1` (Belgien) nicht gewünscht ist:

| Region | Ort | Befehl |
|--------|-----|--------|
| europe-west1 | Belgien | `--region europe-west1` |
| europe-west3 | Frankfurt | `--region europe-west3` |
| europe-west4 | Niederlande | `--region europe-west4` |
| europe-west6 | Zürich | `--region europe-west6` |

---

## Support

Bei Fragen oder Problemen:
- **Google Cloud Dokumentation**: https://cloud.google.com/run/docs
- **Google Cloud Support**: https://cloud.google.com/support

---

*Diese Anleitung wurde erstellt für die Schelhammer Capital Bank Ruhestandsplanung App.*