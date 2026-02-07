# Permanentes Deployment auf Vercel (Kostenlos)

## Vorteile von Vercel
- 100% kostenlos für persönliche Projekte
- Automatische Updates bei Code-Änderungen
- SSL-Zertifikat inklusive
- Globales CDN für schnelle Ladezeiten
- Keine Kreditkarte erforderlich

---

## Schritt-für-Schritt Anleitung

### 1. GitHub Repository erstellen

1. Gehen Sie zu **https://github.com/new**
2. Repository-Name: `ruhestandsplaner`
3. Klicken Sie **"Create repository"**

### 2. Code hochladen

In der Cloud Shell oder lokal:

```bash
cd retirement-planner

# Git initialisieren (falls noch nicht geschehen)
git init
git add .
git commit -m "Ruhestandsplaner App"

# Mit GitHub verbinden
git remote add origin https://github.com/IHR-USERNAME/ruhestandsplaner.git
git branch -M main
git push -u origin main
```

### 3. Vercel Account erstellen

1. Gehen Sie zu **https://vercel.com**
2. Klicken Sie **"Start Deploying"**
3. Wählen Sie **"Continue with GitHub"**
4. Erlauben Sie Vercel Zugriff auf Ihr GitHub

### 4. Projekt deployen

1. Nach dem Login: Klicken Sie **"Add New Project"**
2. Importieren Sie Ihr `ruhestandsplaner` Repository
3. Vercel erkennt automatisch Next.js
4. Klicken Sie **"Deploy"**
5. Warten Sie 2-3 Minuten

### 5. Ihre URL erhalten

Nach dem Deployment erhalten Sie eine URL wie:
```
https://ruhestandsplaner.vercel.app
```

Sie können auch eine eigene Domain verbinden!

---

## Updates durchführen

Bei zukünftigen Änderungen:

```bash
git add .
git commit -m "Beschreibung der Änderung"
git push
```

Vercel deployed automatisch die neue Version!

---

## Eigene Domain (Optional)

1. In Vercel: **Project Settings** → **Domains**
2. Geben Sie Ihre Domain ein (z.B. `ruhestand.ihre-firma.at`)
3. Fügen Sie die angezeigten DNS-Einträge bei Ihrem Domain-Anbieter hinzu

---

## Kosten-Übersicht

| Plan | Preis | Limits |
|------|-------|--------|
| **Hobby (Kostenlos)** | $0/Monat | 100 GB Bandbreite, unbegrenzte Deployments |
| Pro | $20/Monat | Für Teams, mehr Features |

Der kostenlose Plan reicht für die meisten Anwendungsfälle völlig aus!