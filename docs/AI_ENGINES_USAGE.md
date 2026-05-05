# AI Engines Usage Guide

## How to Use Each AI Engine

All engines are available via the REST API and are automatically used by the Pipeline Orchestrator.

---

## 1. Humanized Content Engine

**Purpose:** Makes AI-generated content feel natural with human-like delivery timing.

```bash
POST /api/humanized/humanize
{
  "script": "Your script text here",
  "emotion": "excited"  # excited | calm | urgent | informative | humorous
}
```

**Returns:** Pause timings, gesture points, eye movement directives, voice pitch/speed settings.

**Used in Pipeline:** Step 2 — applied to every variation.

---

## 2. Emotional Resonance Engine

**Purpose:** Scores and aligns emotional tone across script, audio, and visuals.

```bash
# Score content
POST /api/emotional/score
{ "scriptText": "...", "audioLength": 30, "visualElements": 5 }

# Get directives for an emotion
GET /api/emotional/directives/joy
```

**Returns:** Tone, intensity (0–1), alignment scores, music genre, color palette, pacing.

**Emotions:** joy, fear, anger, sadness, surprise, trust, disgust, anticipation

**Used in Pipeline:** Step 3 — scores each variation's emotional profile.

---

## 3. Quality Scoring Engine

**Purpose:** Scores content across audio, visual, script, and technical dimensions.

```bash
POST /api/quality/score
{
  "hasAudio": true,
  "audioLUFS": -14,
  "visualResolution": 1920,
  "frameRate": 30,
  "scriptLength": 500
}
```

**Returns:** audioQuality, visualQuality, scriptQuality, engagementPotential, technicalQuality, overallScore (0–100), issues[], recommendations[].

**Used in Pipeline:** Step 4 — contributes to variation ranking.

---

## 4. Attention Optimizer Engine

**Purpose:** Optimizes content structure for platform-specific audience attention spans.

```bash
POST /api/attention/optimize
{ "duration": 30, "platform": "tiktok" }  # tiktok | instagram | youtube | youtube_shorts

GET /api/attention/hook/:platform/:topic
```

**Returns:** hookLength (seconds), paceMultiplier, transitionFrequency, musicIntensity, visualChangeFrequency, estimatedRetention (0–1).

**Used in Pipeline:** Step 5 — determines hook length and pacing per platform.

---

## 5. Engagement Prediction Engine

**Purpose:** Predicts expected views, likes, shares, and viral potential.

```bash
POST /api/engagement/predict
{
  "views": 1000,
  "hookQuality": "high",    # low | medium | high
  "topicTrend": "high",     # low | medium | high
  "postingTime": "medium"   # low | medium | high
}
```

**Returns:** expectedViews, expectedLikes, expectedComments, expectedShares, engagementRate, viralScore (0–100), peakTime, targetAudience.

**Used in Pipeline:** Step 6 — contributes viralScore to ranking.

---

## 6. Thumbnail Generator Engine

**Purpose:** Creates psychological thumbnail directives to maximize click-through rates.

```bash
POST /api/thumbnail/generate
{
  "title": "Your Video Title",
  "contrast": "high",
  "emotionalTrigger": "curiosity",
  "curiosityGap": "The secret nobody tells you...",
  "bgColor": "#1e293b",
  "textColor": "#ffffff",
  "accentColor": "#6366f1"
}
```

**Returns:** boldTextSize, contrastRatio, colorScheme, emotionalElement, curiosityGapPosition, effectivenessScore.

**Used in Pipeline:** Step 7 — generates thumbnail spec for each variation.

---

## 7. Hook Library Engine

**Purpose:** 20+ viral hook templates with performance scores, filterable by platform/emotion.

```bash
# Get best hooks for a context
GET /api/hooks/best?platform=tiktok&emotion=curiosity&limit=5

# Generate hooks for a specific topic
POST /api/hooks/generate
{ "topic": "productivity", "platform": "instagram", "limit": 5 }
```

**Returns:** Hook objects with text, type, emotion, performanceScore (0–100).

**Used in Pipeline:** Step 1 — generates the initial hook pool.

---

## 8. Watermark Engine

**Purpose:** Generates FFmpeg filter strings for video watermarking.

```bash
POST /api/watermark/filter
{
  "text": "@YourBrand",
  "position": "bottom-right",  # top-left | top-right | bottom-left | bottom-right | center
  "opacity": 0.6,
  "fontSize": 24,
  "color": "white"
}
```

**Returns:** FFmpeg `drawtext` or `overlay` filter string ready for use in render pipeline.

**Used in Pipeline:** Step 8 — applies brand watermark to each variation.

---

## AI Score Interpretation

| Score Range | Meaning |
|-------------|---------|
| 80–100 | Excellent — high viral potential |
| 65–79 | Good — strong performance expected |
| 50–64 | Average — may need optimization |
| Below 50 | Poor — consider regenerating |

---

## Pipeline vs. Individual Engine Use

| Use Case | Recommendation |
|----------|---------------|
| Generate 1 piece of content fast | Auto Mode pipeline with bulkCount=1 |
| Generate 30 posts for a month | Auto Mode pipeline with bulkCount=30 + autoSchedule=true |
| Fine-tune a specific engine | Use individual engine API endpoints |
| A/B test different hooks | Run pipeline 2x with different tones, compare scores |
| Understand emotional profile | Call /api/emotional/score directly |
