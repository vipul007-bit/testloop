#!/usr/bin/env python3
"""
OmniShield — DBSCAN Hotspot Detection Demo
==========================================
Run:  python3 dbscan_demo.py
Deps: pip install scikit-learn numpy

This script:
  1. Loads 30 mock GPS-tagged diagnosis records (India cities)
  2. Runs sklearn DBSCAN (eps=0.5°≈55km, min_samples=3)
  3. Identifies disease cluster centres (hotspots)
  4. Classifies severity: CRITICAL / HIGH / MODERATE
  5. Prints cluster JSON ready for the frontend map
  6. Also prints a DP analytics demo (Laplace noise on counts)

In production: replace MOCK_DATA with real rows from:
  SELECT noisy_icd_code, ST_X(reported_location), ST_Y(reported_location)
  FROM surveillance_reports
  WHERE created_at > NOW() - INTERVAL '72 hours';
"""

import json
import math
import random
from collections import Counter

# ── Try importing sklearn / numpy; fall back to pure-Python ──

try:
    import numpy as np
    from sklearn.cluster import DBSCAN
    SKLEARN = True
except ImportError:
    SKLEARN = False
    print("[WARN] sklearn/numpy not found — using pure-Python KMeans fallback")
    print("[WARN] Install: pip install scikit-learn numpy\n")


# ─────────────────────────────────────────────────────────────
# MOCK DATA — 30 GPS-tagged diagnosis reports
# Format: (latitude, longitude, icd_code)
# In production: query surveillance_reports table
# ─────────────────────────────────────────────────────────────
MOCK_DATA = [
    # Delhi NCR cluster — Dengue surge
    (28.61, 77.20, "A90"),  (28.65, 77.22, "A90"),  (28.58, 77.18, "A90"),
    (28.70, 77.15, "A90"),  (28.63, 77.25, "A90"),  (28.67, 77.21, "A90"),
    (28.55, 77.30, "A90"),  (28.72, 77.19, "A90"),

    # Mumbai Metro cluster — Dengue + Cholera
    (19.08, 72.88, "A90"),  (19.02, 72.83, "A90"),  (19.12, 72.91, "A90"),
    (19.06, 72.85, "A00.9"), (19.15, 72.94, "A00.9"), (18.95, 72.80, "A90"),
    (19.09, 72.87, "A90"),  (19.01, 72.82, "A00.9"),

    # Kolkata cluster — Typhoid
    (22.57, 88.36, "A01.0"), (22.60, 88.40, "A01.0"), (22.55, 88.32, "A01.0"),
    (22.62, 88.38, "A01.0"), (22.53, 88.34, "A01.0"),

    # Bengaluru cluster — Malaria
    (12.97, 77.59, "B54"),  (12.92, 77.55, "B54"),  (13.02, 77.63, "B54"),
    (12.95, 77.61, "B54"),

    # Hyderabad — Pneumonia (sparse, borderline cluster)
    (17.38, 78.47, "J18.9"), (17.42, 78.51, "J18.9"), (17.35, 78.44, "J18.9"),

    # Guwahati — isolated case (noise point, won't form cluster)
    (26.18, 91.74, "A09"),
]


# ─────────────────────────────────────────────────────────────
# DBSCAN CLUSTERING
# ─────────────────────────────────────────────────────────────

def run_dbscan(data):
    """
    Run DBSCAN on (lat, lon) coordinates.
    eps=0.5 degrees ≈ 55km radius
    min_samples=3 minimum points to form a cluster
    """
    coords = [(lat, lon) for lat, lon, _ in data]

    if SKLEARN:
        coords_np = np.array(coords)
        # Convert degrees to radians for haversine metric
        coords_rad = np.radians(coords_np)
        # eps in radians: 0.5° / 57.3 ≈ 0.00873 rad
        model = DBSCAN(
            eps=0.5,         # degrees (~55km)
            min_samples=3,   # minimum cases to form a cluster
            metric="euclidean"
        )
        labels = model.fit_predict(coords_np)
    else:
        # Pure Python fallback — simple proximity grouping
        labels = pure_python_cluster(coords, eps=0.5, min_samples=3)

    return labels


def pure_python_cluster(coords, eps, min_samples):
    """Simple DBSCAN without sklearn — for environments without numpy."""
    n = len(coords)
    labels = [-1] * n
    cluster_id = 0

    def neighbors(idx):
        lat1, lon1 = coords[idx]
        return [j for j, (lat2, lon2) in enumerate(coords)
                if math.sqrt((lat1-lat2)**2 + (lon1-lon2)**2) <= eps]

    visited = set()
    for i in range(n):
        if i in visited:
            continue
        visited.add(i)
        nb = neighbors(i)
        if len(nb) < min_samples:
            labels[i] = -1  # noise
            continue
        labels[i] = cluster_id
        seeds = set(nb) - {i}
        while seeds:
            j = seeds.pop()
            if j not in visited:
                visited.add(j)
                nb2 = neighbors(j)
                if len(nb2) >= min_samples:
                    seeds |= set(nb2)
            if labels[j] == -1:
                labels[j] = cluster_id
        cluster_id += 1

    return labels


# ─────────────────────────────────────────────────────────────
# BUILD CLUSTER RESULTS
# ─────────────────────────────────────────────────────────────

def build_clusters(data, labels):
    clusters = {}
    for i, (lat, lon, icd) in enumerate(data):
        lbl = labels[i]
        if lbl == -1:
            continue  # noise point
        if lbl not in clusters:
            clusters[lbl] = {"lats": [], "lons": [], "icds": []}
        clusters[lbl]["lats"].append(lat)
        clusters[lbl]["lons"].append(lon)
        clusters[lbl]["icds"].append(icd)

    results = []
    for cid, c in clusters.items():
        count = len(c["lats"])
        centre_lat = sum(c["lats"]) / count
        centre_lon = sum(c["lons"]) / count
        dominant_icd = Counter(c["icds"]).most_common(1)[0][0]

        # Severity thresholds (mirrors schema.sql trigger)
        if count >= 10:
            severity = "CRITICAL"
        elif count >= 6:
            severity = "HIGH"
        else:
            severity = "MODERATE"

        results.append({
            "cluster_id":    cid + 1,
            "centre_lat":    round(centre_lat, 5),
            "centre_lon":    round(centre_lon, 5),
            "case_count":    count,
            "dominant_icd":  dominant_icd,
            "severity":      severity,
        })

    return sorted(results, key=lambda r: r["case_count"], reverse=True)


# ─────────────────────────────────────────────────────────────
# DIFFERENTIAL PRIVACY ANALYTICS DEMO
# Mirrors the frontend DPPanel and privacyEngine.ts
# ─────────────────────────────────────────────────────────────

ICD_NAMES = {
    "A90":   "Dengue fever",
    "A01.0": "Typhoid fever",
    "B54":   "Malaria",
    "A00.9": "Cholera",
    "J18.9": "Pneumonia",
    "A09":   "Gastroenteritis",
    "U07.1": "COVID-19",
}

def laplace_noise(sensitivity: float, epsilon: float) -> float:
    """Draw Laplace(0, sensitivity/epsilon) noise — same formula as frontend."""
    scale = sensitivity / epsilon
    u = random.uniform(-0.5, 0.5)
    return -scale * math.copysign(1, u) * math.log(1 - 2 * abs(u))

def dp_analytics(data, epsilon: float = 0.75):
    """Compute exact counts and ε-DP noised counts per ICD-10 code."""
    exact = Counter(icd for _, _, icd in data)
    print(f"\n{'='*60}")
    print(f"  DIFFERENTIAL PRIVACY ANALYTICS  (ε = {epsilon})")
    print(f"{'='*60}")
    print(f"  {'Disease':<20} {'ICD':<8} {'Exact':>7}  {'DP-Noised':>10}  {'Δ':>6}")
    print(f"  {'-'*56}")
    for icd, count in sorted(exact.items(), key=lambda x: -x[1]):
        noisy = max(0, round(count + laplace_noise(1.0, epsilon)))
        delta = noisy - count
        name = ICD_NAMES.get(icd, icd)
        print(f"  {name:<20} {icd:<8} {count:>7}  {noisy:>10}  {delta:>+6}")
    print(f"\n  Formula: noised = exact + Laplace(0, sensitivity/ε)")
    print(f"  Lower ε → stronger privacy → more noise")
    print(f"  Admin sees exact; Public API returns noised counts only")


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  OmniShield — DBSCAN Disease Hotspot Detection")
    print(f"  Records: {len(MOCK_DATA)}  |  Algorithm: DBSCAN")
    print(f"  eps = 0.5° (~55km)  |  min_samples = 3")
    print("=" * 60)

    labels = run_dbscan(MOCK_DATA)
    clusters = build_clusters(MOCK_DATA, labels)

    noise_count = sum(1 for l in labels if l == -1)
    print(f"\n  Found {len(clusters)} clusters  |  {noise_count} noise point(s)\n")

    for c in clusters:
        sev_icon = "🔴" if c["severity"] == "CRITICAL" else "🟠" if c["severity"] == "HIGH" else "🟡"
        print(f"  {sev_icon} Cluster {c['cluster_id']}: {c['case_count']} cases")
        print(f"     Centre:    {c['centre_lat']}°N, {c['centre_lon']}°E")
        print(f"     Dominant:  {c['dominant_icd']} ({ICD_NAMES.get(c['dominant_icd'], '?')})")
        print(f"     Severity:  {c['severity']}\n")

    # Output as JSON for the frontend / API (convert numpy types for JSON)
    def json_safe(obj):
        if hasattr(obj, 'item'):
            return obj.item()
        raise TypeError(f"Not serializable: {type(obj)}")
    print("\n  ── JSON Output (for /api/v1/surveillance/stats) ──")
    print(json.dumps(clusters, indent=2, default=json_safe))

    # Differential Privacy demo
    dp_analytics(MOCK_DATA, epsilon=0.75)
    print("\n  ── ε=0.1 (strong privacy, high noise) ──")
    dp_analytics(MOCK_DATA, epsilon=0.1)

    print("\n" + "=" * 60)
    print("  Done. In production, connect to PostgreSQL:")
    print("  psql -U omnishield -d omnishield_db -f schema.sql")
    print("  # The PostGIS trigger runs ST_ClusterDBSCAN automatically")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
