"""
Mock data layer for the Crop Health Agent.

In production, replace symptom matching with a real ML model (e.g. a
fine-tuned image classifier or an NLP model trained on agronomic data).
Everything else in agent.py stays the same since it only depends on the
DISEASE_DB and CROP_DISEASES structures defined here.
"""

# disease_id -> full disease profile
DISEASE_DB = {
    "tomato_blight": {
        "name": "Early Blight",
        "crop": "Tomato",
        "severity": "High",
        "symptoms": ["brown spots", "yellow leaves", "dark lesions", "wilting", "leaf drop"],
        "causes": "Fungal infection (Alternaria solani), favoured by warm humid weather.",
        "treatment": [
            "Remove and destroy infected leaves immediately.",
            "Apply copper-based fungicide (Mancozeb 75 WP @ 2g/L).",
            "Avoid overhead irrigation; water at the base.",
            "Rotate crops — do not plant tomato in the same plot next season.",
        ],
        "prevention": [
            "Use certified disease-free seeds.",
            "Maintain proper plant spacing for air circulation.",
            "Apply neem oil spray as a preventive measure every 10 days.",
        ],
        "recovery_days": 14,
        "yield_loss_percent": 30,
    },
    "tomato_mosaic": {
        "name": "Tomato Mosaic Virus",
        "crop": "Tomato",
        "severity": "Medium",
        "symptoms": ["mosaic pattern", "mottled leaves", "stunted growth", "distorted fruit", "yellow patches"],
        "causes": "Tobacco Mosaic Virus (TMV) spread by contact and aphids.",
        "treatment": [
            "No chemical cure; remove and destroy infected plants.",
            "Control aphid vectors with imidacloprid spray.",
            "Disinfect tools with 10% bleach solution.",
        ],
        "prevention": [
            "Use TMV-resistant varieties.",
            "Wash hands before handling plants.",
            "Control weeds that harbour aphids.",
        ],
        "recovery_days": 0,
        "yield_loss_percent": 50,
    },
    "rice_blast": {
        "name": "Rice Blast",
        "crop": "Rice",
        "severity": "High",
        "symptoms": ["diamond shaped lesions", "grey center spots", "neck rot", "white panicles", "leaf blight"],
        "causes": "Fungal pathogen Magnaporthe oryzae; spreads in cool humid conditions.",
        "treatment": [
            "Apply Tricyclazole 75 WP @ 0.6g/L at first sign.",
            "Drain fields and allow soil to dry briefly.",
            "Avoid excess nitrogen fertiliser.",
        ],
        "prevention": [
            "Plant blast-resistant varieties (IR64, Swarna).",
            "Balanced NPK fertilisation.",
            "Seed treatment with Carbendazim before sowing.",
        ],
        "recovery_days": 21,
        "yield_loss_percent": 40,
    },
    "rice_bacterial_blight": {
        "name": "Bacterial Leaf Blight",
        "crop": "Rice",
        "severity": "High",
        "symptoms": ["water soaked margins", "yellowing leaf edges", "wilting", "milky ooze", "leaf scorch"],
        "causes": "Xanthomonas oryzae pv. oryzae; enters through wounds and stomata.",
        "treatment": [
            "Spray Copper Oxychloride 50 WP @ 3g/L.",
            "Avoid flood irrigation during outbreak.",
            "Remove severely infected tillers.",
        ],
        "prevention": [
            "Use resistant varieties (IR20, Pusa Basmati).",
            "Avoid high nitrogen doses.",
            "Treat seeds with Streptocycline before sowing.",
        ],
        "recovery_days": 18,
        "yield_loss_percent": 35,
    },
    "wheat_rust": {
        "name": "Yellow Rust (Stripe Rust)",
        "crop": "Wheat",
        "severity": "High",
        "symptoms": ["yellow stripes", "orange pustules", "powdery coating", "leaf curl", "stunted plant"],
        "causes": "Puccinia striiformis fungus; spreads rapidly in cool moist weather.",
        "treatment": [
            "Apply Propiconazole 25 EC @ 1ml/L at first sign.",
            "Spray Tebuconazole 250 EW as follow-up after 14 days.",
            "Remove volunteer wheat plants around the field.",
        ],
        "prevention": [
            "Sow rust-resistant varieties (HD 2967, PBW 550).",
            "Timely sowing to avoid peak rust season.",
            "Monitor fields weekly during tillering stage.",
        ],
        "recovery_days": 16,
        "yield_loss_percent": 45,
    },
    "onion_purple_blotch": {
        "name": "Purple Blotch",
        "crop": "Onion",
        "severity": "Medium",
        "symptoms": ["purple lesions", "white center spots", "leaf dieback", "neck rot", "yellowing tips"],
        "causes": "Alternaria porri fungus; thrives in warm wet conditions.",
        "treatment": [
            "Spray Mancozeb 75 WP @ 2.5g/L every 7 days.",
            "Apply Iprodione 50 WP for severe infections.",
            "Improve field drainage.",
        ],
        "prevention": [
            "Use disease-free sets/transplants.",
            "Avoid overhead irrigation.",
            "Crop rotation with non-allium crops.",
        ],
        "recovery_days": 12,
        "yield_loss_percent": 25,
    },
    "potato_late_blight": {
        "name": "Late Blight",
        "crop": "Potato",
        "severity": "Critical",
        "symptoms": ["dark water soaked lesions", "white mold underside", "rapid wilting", "tuber rot", "foul smell"],
        "causes": "Phytophthora infestans oomycete; spreads explosively in cool wet weather.",
        "treatment": [
            "Apply Metalaxyl + Mancozeb (Ridomil Gold) @ 2.5g/L immediately.",
            "Remove and bury infected haulms away from field.",
            "Avoid irrigation during outbreak.",
        ],
        "prevention": [
            "Use certified blight-free seed tubers.",
            "Plant resistant varieties (Kufri Jyoti, Kufri Bahar).",
            "Prophylactic spray of Chlorothalonil before monsoon.",
        ],
        "recovery_days": 25,
        "yield_loss_percent": 70,
    },
    "cotton_bollworm": {
        "name": "American Bollworm",
        "crop": "Cotton",
        "severity": "High",
        "symptoms": ["bored bolls", "frass near entry holes", "shedding squares", "damaged flowers", "caterpillar inside boll"],
        "causes": "Helicoverpa armigera larvae; multiple generations per season.",
        "treatment": [
            "Spray Emamectin Benzoate 5 SG @ 0.4g/L.",
            "Apply Spinosad 45 SC @ 0.3ml/L as alternate.",
            "Install pheromone traps (5/acre) for monitoring.",
        ],
        "prevention": [
            "Use Bt cotton varieties.",
            "Intercrop with marigold to attract and trap adults.",
            "Avoid excessive nitrogen which promotes lush growth.",
        ],
        "recovery_days": 10,
        "yield_loss_percent": 40,
    },
    "maize_fall_armyworm": {
        "name": "Fall Armyworm",
        "crop": "Maize",
        "severity": "High",
        "symptoms": ["ragged leaf feeding", "frass in whorl", "window pane damage", "stem boring", "ear damage"],
        "causes": "Spodoptera frugiperda moth larvae; highly migratory pest.",
        "treatment": [
            "Apply Chlorantraniliprole 18.5 SC @ 0.4ml/L into whorl.",
            "Spray Spinetoram 11.7 SC @ 0.5ml/L.",
            "Use sand + lime mixture in whorl for early instar larvae.",
        ],
        "prevention": [
            "Early planting to escape peak pest pressure.",
            "Use push-pull intercropping (Desmodium + Napier grass).",
            "Encourage natural enemies (Trichogramma wasps).",
        ],
        "recovery_days": 12,
        "yield_loss_percent": 35,
    },
    "soybean_rust": {
        "name": "Asian Soybean Rust",
        "crop": "Soybean",
        "severity": "Medium",
        "symptoms": ["tan lesions", "rust pustules underside", "premature defoliation", "yellowing", "small pods"],
        "causes": "Phakopsora pachyrhizi fungus; wind-dispersed spores.",
        "treatment": [
            "Apply Trifloxystrobin + Tebuconazole @ 1ml/L.",
            "Spray Azoxystrobin 23 SC @ 1ml/L as alternate.",
        ],
        "prevention": [
            "Plant early-maturing varieties to escape late-season rust.",
            "Monitor fields from pod-fill stage.",
            "Avoid dense canopy by proper row spacing.",
        ],
        "recovery_days": 14,
        "yield_loss_percent": 30,
    },
    "banana_panama": {
        "name": "Panama Wilt (Fusarium Wilt)",
        "crop": "Banana",
        "severity": "Critical",
        "symptoms": ["yellowing lower leaves", "wilting", "brown vascular tissue", "plant collapse", "split pseudostem"],
        "causes": "Fusarium oxysporum f.sp. cubense; soil-borne, no chemical cure.",
        "treatment": [
            "No effective chemical treatment once infected.",
            "Uproot and destroy infected plants with roots.",
            "Drench soil with Carbendazim to limit spread.",
            "Quarantine the affected area.",
        ],
        "prevention": [
            "Plant Fusarium-resistant varieties (Grand Naine, FHIA hybrids).",
            "Use tissue-culture disease-free planting material.",
            "Avoid waterlogging; improve drainage.",
        ],
        "recovery_days": 0,
        "yield_loss_percent": 100,
    },
    "chilli_anthracnose": {
        "name": "Anthracnose (Fruit Rot)",
        "crop": "Chilli",
        "severity": "Medium",
        "symptoms": ["sunken lesions on fruit", "orange spore masses", "fruit rot", "dark circular spots", "premature fruit drop"],
        "causes": "Colletotrichum capsici fungus; spreads in warm humid weather.",
        "treatment": [
            "Spray Carbendazim 50 WP @ 1g/L.",
            "Apply Azoxystrobin 23 SC @ 1ml/L.",
            "Remove and destroy infected fruits.",
        ],
        "prevention": [
            "Use hot-water treated seeds (52°C for 30 min).",
            "Avoid wounding fruits during harvest.",
            "Maintain field hygiene; remove crop debris.",
        ],
        "recovery_days": 10,
        "yield_loss_percent": 30,
    },
    "groundnut_leaf_spot": {
        "name": "Early Leaf Spot",
        "crop": "Groundnut",
        "severity": "Medium",
        "symptoms": ["circular brown spots", "yellow halo", "defoliation", "dark lesions", "premature leaf drop"],
        "causes": "Cercospora arachidicola fungus.",
        "treatment": [
            "Spray Chlorothalonil 75 WP @ 2g/L every 10 days.",
            "Apply Tebuconazole 25.9 EC @ 1ml/L.",
        ],
        "prevention": [
            "Use resistant varieties (ICGV 86031).",
            "Crop rotation with cereals.",
            "Avoid dense planting.",
        ],
        "recovery_days": 14,
        "yield_loss_percent": 20,
    },
    "healthy": {
        "name": "Healthy Plant",
        "crop": "Any",
        "severity": "None",
        "symptoms": ["green leaves", "normal growth", "no spots", "healthy color", "vigorous plant"],
        "causes": "No disease detected.",
        "treatment": ["No treatment needed. Continue regular care."],
        "prevention": [
            "Maintain balanced fertilisation.",
            "Regular field scouting.",
            "Timely irrigation.",
        ],
        "recovery_days": 0,
        "yield_loss_percent": 0,
    },
}

# crop -> list of possible disease ids (for symptom matching scope)
CROP_DISEASES = {
    "Tomato":    ["tomato_blight", "tomato_mosaic", "healthy"],
    "Rice":      ["rice_blast", "rice_bacterial_blight", "healthy"],
    "Wheat":     ["wheat_rust", "healthy"],
    "Onion":     ["onion_purple_blotch", "healthy"],
    "Potato":    ["potato_late_blight", "healthy"],
    "Cotton":    ["cotton_bollworm", "healthy"],
    "Maize":     ["maize_fall_armyworm", "healthy"],
    "Soybean":   ["soybean_rust", "healthy"],
    "Banana":    ["banana_panama", "healthy"],
    "Chilli":    ["chilli_anthracnose", "healthy"],
    "Groundnut": ["groundnut_leaf_spot", "healthy"],
}

SUPPORTED_CROPS = list(CROP_DISEASES.keys())

SEVERITY_SCORE = {"None": 0, "Low": 1, "Medium": 2, "High": 3, "Critical": 4}
