# FPL Draft - Potential Statistics & Metrics

Based on available data, here are statistics we could calculate.

---

## 1. Luck-Based Metrics

### A. Current Implementation
```
Points Luck = Actual Points - Expected Points
Expected = 10-GW rolling average × FDR multiplier
```
**Issues:** Conflates skill with luck, arbitrary FDR multipliers, small sample size

---

### B. xG-Based Luck (Recommended Enhancement)

**Finishing Luck (Attackers)**
```
Finishing Luck = Goals Scored - xG
```
- Positive = clinical finishing or lucky deflections
- Negative = hitting woodwork, great saves against you
- Most "pure" luck metric - xG controls for chance quality

**Creation Luck**
```
Creation Luck = Assists - xA
```
- Positive = teammates finishing above expected
- Negative = teammates missing chances you created

**Combined Attacking Luck**
```
Attacking Luck = (Goals + Assists) - xGI
```

**Defensive Luck (Defenders/GKs)**
```
Defensive Luck = xGC - Goals Conceded
```
- Positive = opponents missing chances (lucky)
- Negative = opponents clinical (unlucky)

---

### C. Bonus Point Luck

**BPS Conversion Luck**
```
BPS Luck = Bonus Points - Expected Bonus
Expected Bonus = f(BPS ranking in match)
```
- Did you get 3 bonus when BPS was close?
- Did you miss out on bonus by 1 BPS?

**Idea:** Track how often a player was within 5 BPS of getting more/fewer bonus

---

### D. Clean Sheet Luck (Defenders/GKs)

**CS Luck**
```
CS Luck = Clean Sheets - Expected Clean Sheets
Expected CS = P(team keeps CS | opponent xG, home/away)
```
- Based on opponent's xG that match
- Low xGC but conceded = unlucky
- High xGC but kept CS = lucky

---

### E. Minutes/Selection Luck

**Rotation Luck**
```
Rotation Luck = Expected Points Lost to Rotation
= Σ (games benched × expected points if played)
```
- Player was fit but manager rotated them

**Injury Luck**
```
Injury Points Lost = Σ (points scored by replacement - expected points of injured player)
```

---

## 2. Skill-Based Metrics

### A. Captaincy Skill

**Captain Success Rate**
```
Captain Hit Rate = GWs where captain scored > team average
```

**Captain Points Above Replacement**
```
Captain PAR = Actual Captain Points - Best Non-Captain Points
```
- Positive = good captain picks
- Negative = wrong captain choices

**Captain xG Differential**
```
Did you captain players with high xG that week?
```

---

### B. Transfer Skill

**Transfer Value** (Currently Implemented)
```
Transfer Value = Actual Points - Points if kept GW1 squad
```

**Transfer Timing**
```
Points from players in first 4 GWs after transfer in
vs Points from players in last 4 GWs before transfer out
```

**Waiver Priority Efficiency**
```
Points gained per waiver pick used
```

---

### C. Bench Management

**Bench Points Lost** (Currently Implemented)
```
Points scored by bench players
```

**Auto-Sub Luck**
```
Points gained/lost from auto-subs activating
Did your bench player come on for a 1-pointer blocking a 10-pointer?
```

**Optimal Bench Decisions**
```
% of weeks where starting XI was optimal vs bench
```

---

### D. Squad Construction

**Position Allocation Efficiency**
```
Points by position vs league average by position
```

**Template vs Differential**
```
% of points from high-ownership (>50%) vs low-ownership (<20%) players
```

---

## 3. Opponent-Adjusted Metrics

### A. Strength of Schedule

**Schedule Luck**
```
Average opponent strength faced vs league average
```
- Based on opponent's season PPG
- Did you face teams on good/bad runs?

**Fixture Timing Luck**
```
Did you face rivals when they had injuries/suspensions?
```

---

### B. H2H Specific

**H2H Luck Index**
```
Wins where you scored below season average
+ Losses where you scored above season average
```
- Won despite bad week = lucky
- Lost despite good week = unlucky

**Margin Luck**
```
Average winning margin vs Average losing margin
Close wins + big losses = lucky season
```

**Points Rank vs League Rank**
```
If total points rank = 2nd but league position = 5th → unlucky H2H draws
```

---

## 4. Variance Metrics

### A. Consistency Score

**Points Volatility**
```
Standard deviation of weekly scores
```
- Low = consistent
- High = boom/bust

**Floor/Ceiling**
```
Minimum GW score (floor)
Maximum GW score (ceiling)
Range = Ceiling - Floor
```

---

### B. Clutch Performance

**Big Game Performance**
```
Points in matches vs top 3 opponents
vs Points in matches vs bottom 3 opponents
```

**Must-Win Performance**
```
Points in GWs where you needed a result to improve position
```

---

## 5. Composite Indices

### A. True Luck Index (Proposed)

Weighted combination:
```
True Luck =
  0.35 × Attacking Luck (xG-based)
+ 0.25 × Defensive Luck (xGC-based)
+ 0.20 × Bonus Point Luck
+ 0.10 × H2H Margin Luck
+ 0.10 × Schedule Luck
```

### B. Skill Index (Proposed)

```
Skill Index =
  0.30 × Captain Success
+ 0.25 × Transfer Value
+ 0.25 × Bench Management
+ 0.20 × Optimal Lineup %
```

### C. Overall Performance Decomposition

```
Total Points = Baseline + Skill Component + Luck Component + Noise

Where:
- Baseline = League average points
- Skill = Captaincy + Transfers + Lineup decisions
- Luck = xG over/underperformance + H2H luck
- Noise = Unexplained variance
```

---

## 6. Fun/Novelty Stats

### A. Heartbreak Index
```
Points lost in last 10 mins of matches (CS wipes, late goals conceded)
```

### B. Set Piece Reliance
```
% of points from penalties, free kicks
```

### C. One-Player Dependency
```
% of total points from highest-scoring player
```

### D. Clutch Captain
```
Captain hauls (15+ points) vs Captain blanks (< 4 points)
```

### E. Woodwork Index
```
xG - Goals when xG was high (shots hitting post, saved pens)
```

---

## Implementation Priority

| Metric | Difficulty | Data Available | Fun Factor | Priority |
|--------|------------|----------------|------------|----------|
| xG Luck | Medium | Yes | High | 1 |
| Bonus Luck | Easy | Yes | Medium | 2 |
| Captain Skill | Easy | Yes | High | 3 |
| H2H Luck | Easy | Yes | High | 4 |
| CS Luck | Medium | Yes | Medium | 5 |
| Consistency | Easy | Yes | Medium | 6 |
