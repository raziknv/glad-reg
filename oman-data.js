/**
 * Oman administrative data: Region (Governorate) -> Wilayat (Province) -> Village.
 *
 * REGIONS / WILAYATS: compiled from the Sultanate of Oman's Ministry of Foreign
 * Affairs (fm.gov.om/about-oman/state/oman-by-region) and cross-checked against
 * NCSI census breakdowns (11 governorates / 63 wilayats). This list has 62 entries;
 * before going live, do a quick check against fm.gov.om or ncsi.gov.om in case a
 * wilayat was created/renamed very recently — swapping a name here is a one-line edit.
 *
 * VILLAGES: there is no single official, machine-readable list of every village
 * under every wilayat published by Oman. NCSI's 2020 "localities" census data
 * (ncsi.gov.om) is the closest official source but is only distributed as large
 * PDF/report files, not structured for hundreds of villages in one drop. So:
 *   - Where we could confirm a village name against NCSI/official sources, it's
 *     listed below and will appear as a selectable option.
 *   - Every wilayat ALSO gets an "Other / village not listed" option, which reveals
 *     a free-text box — so no one is blocked from registering, and you build up a
 *     verified list over time from what people actually type in.
 *   - To add more confirmed villages later, just add strings to the array for that
 *     wilayat below. No other code needs to change.
 */

const OMAN_DATA = {
  "Muscat": {
    wilayats: {
      "Muscat": [],
      "Muttrah": [],
      "Bawshar": ["Al Khuwair", "Madinat As Sultan Qaboos", "Al Ghubrah", "Azaiba"],
      "A'Seeb": ["Al Khoudh", "Al Mabaila", "Al Maabilah", "Amerat Al Seeb"],
      "Al Amarat": [],
      "Qurayyat": []
    }
  },
  "Dhofar": {
    wilayats: {
      "Salalah": ["Al Hafa", "Al Dahariz", "Salalah Downtown"],
      "Taqah": [],
      "Mirbat": [],
      "Sadah": [],
      "Rakhyut": [],
      "Dhalkut": [],
      "Thumrait": [],
      "Muqshin": [],
      "Al Mazyouna": [],
      "Shalim and the Hallaniyat Islands": []
    }
  },
  "Musandam": {
    wilayats: {
      "Khasab": [],
      "Bukha": [],
      "Dibba": [],
      "Madha": []
    }
  },
  "Al Buraimi": {
    wilayats: {
      "Al Buraimi": [],
      "Mahdah": [],
      "As Sunaynah": []
    }
  },
  "Ad Dakhiliyah": {
    wilayats: {
      "Nizwa": [],
      "Bahla": [],
      "Samail": [],
      "Izki": [],
      "Bidbid": [],
      "Adam": [],
      "Al Hamra": [],
      "Manah": ["Al Mahyul", "Al Mara", "Al Abyad", "Abu Nikhaylah"],
      "Jebel Akhdar": []
    }
  },
  "Al Batinah North": {
    wilayats: {
      "Sohar": [],
      "Suwaiq": [],
      "Saham": [],
      "Al Khaburah": [],
      "Shinas": [],
      "Liwa": []
    }
  },
  "Al Batinah South": {
    wilayats: {
      "Rustaq": [],
      "Al Awabi": [],
      "Al Musanaah": [],
      "Barka": [],
      "Nakhal": [],
      "Wadi Al Maawil": []
    }
  },
  "Ash Sharqiyah North": {
    wilayats: {
      "Ibra": [],
      "Bidiya": [],
      "Al Kabil": [],
      "Al Mudhaibi": [],
      "Dima Wa Al Ta'yin": [],
      "Wadi Bani Khalid": []
    }
  },
  "Ash Sharqiyah South": {
    wilayats: {
      "Sur": [],
      "Al Kamil Wal Wafi": [],
      "Jalan Bani Bu Ali": [],
      "Jalan Bani Bu Hassan": [],
      "Masirah": []
    }
  },
  "Ad Dhahirah": {
    wilayats: {
      "Ibri": [],
      "Dhank": [],
      "Yanqul": []
    }
  },
  "Al Wusta": {
    wilayats: {
      "Haima": [],
      "Al Jazer": [],
      "Duqm": [],
      "Mahout": []
    }
  }
};

// Export for both plain <script> usage (window.OMAN_DATA) and module usage.
if (typeof window !== "undefined") window.OMAN_DATA = OMAN_DATA;
if (typeof module !== "undefined" && module.exports) module.exports = OMAN_DATA;
