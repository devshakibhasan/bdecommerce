export interface District {
  name: string;
  name_bn: string;
  division: string;
  is_dhaka_metro?: boolean;
  is_suburb?: boolean;
  thanas: { name: string; name_bn: string; is_suburb?: boolean }[];
}

export const BANGLADESH_DISTRICTS: District[] = [
  {
    "name": "Dhaka",
    "name_bn": "ঢাকা",
    "division": "Dhaka",
    "thanas": [
      {
        "name": "Dhanmondi",
        "name_bn": "ধানমন্ডি"
      },
      {
        "name": "Gulshan",
        "name_bn": "গুলশান"
      },
      {
        "name": "Banani",
        "name_bn": "বনানী"
      },
      {
        "name": "Uttara",
        "name_bn": "উত্তরা"
      },
      {
        "name": "Mirpur",
        "name_bn": "মিরপুর"
      },
      {
        "name": "Mohammadpur",
        "name_bn": "মোহাম্মদপুর"
      },
      {
        "name": "Motijheel",
        "name_bn": "মতিঝিল"
      },
      {
        "name": "Tejgaon",
        "name_bn": "তেজগাঁও"
      },
      {
        "name": "Badda",
        "name_bn": "বাড্ডা"
      },
      {
        "name": "Khilgaon",
        "name_bn": "খিলগাঁও"
      },
      {
        "name": "Rampura",
        "name_bn": "রামপুরা"
      },
      {
        "name": "Malibagh",
        "name_bn": "মালিবাগ"
      },
      {
        "name": "Paltan",
        "name_bn": "পল্টন"
      },
      {
        "name": "Shahbagh",
        "name_bn": "শাহবাগ"
      },
      {
        "name": "Lalbagh (Old Dhaka)",
        "name_bn": "লালবাগ (পুরান ঢাকা)"
      },
      {
        "name": "Kotwali (Old Dhaka)",
        "name_bn": "কোতোয়ালি (পুরান ঢাকা)"
      },
      {
        "name": "Sutrapur (Old Dhaka)",
        "name_bn": "সূত্রাপুর (পুরান ঢাকা)"
      },
      {
        "name": "Jatrabari",
        "name_bn": "যাত্রাবাড়ী"
      },
      {
        "name": "Demra",
        "name_bn": "ডেমরা"
      },
      {
        "name": "Basabo",
        "name_bn": "বাসাবো"
      },
      {
        "name": "Bashundhara R/A",
        "name_bn": "বসুন্ধরা আ/এ"
      },
      {
        "name": "Cantonment",
        "name_bn": "সেনানিবাস"
      },
      {
        "name": "Kafrul",
        "name_bn": "কাফরুল"
      },
      {
        "name": "Pallabi",
        "name_bn": "পল্লবী"
      },
      {
        "name": "Hazaribagh",
        "name_bn": "হাজারীবাগ"
      },
      {
        "name": "Kamrangirchar",
        "name_bn": "কামরাঙ্গীরচর"
      },
      {
        "name": "Khilkhet",
        "name_bn": "খিলক্ষেত"
      },
      {
        "name": "Bhatara",
        "name_bn": "ভাটারা"
      },
      {
        "name": "Savar",
        "name_bn": "সাভার",
        "is_suburb": true
      },
      {
        "name": "Dhamrai",
        "name_bn": "ধামরাই",
        "is_suburb": true
      },
      {
        "name": "Keraniganj",
        "name_bn": "কেরানীগঞ্জ",
        "is_suburb": true
      },
      {
        "name": "Nawabganj",
        "name_bn": "নবাবগঞ্জ",
        "is_suburb": true
      },
      {
        "name": "Dohar",
        "name_bn": "দোহার",
        "is_suburb": true
      }
    ]
  },
  {
    "name": "Gazipur",
    "name_bn": "গাজীপুর",
    "division": "Dhaka",
    "is_suburb": true,
    "thanas": [
      {
        "name": "Gazipur Sadar",
        "name_bn": "গাজীপুর সদর",
        "is_suburb": true
      },
      {
        "name": "Tongi",
        "name_bn": "টঙ্গী",
        "is_suburb": true
      },
      {
        "name": "Kaliakair",
        "name_bn": "কালিয়াকৈর",
        "is_suburb": true
      },
      {
        "name": "Kapasia",
        "name_bn": "কাপাসিয়া",
        "is_suburb": true
      },
      {
        "name": "Sreepur",
        "name_bn": "শ্রীপুর",
        "is_suburb": true
      },
      {
        "name": "Kaliganj",
        "name_bn": "কালীগঞ্জ",
        "is_suburb": true
      }
    ]
  },
  {
    "name": "Narayanganj",
    "name_bn": "নারায়ণগঞ্জ",
    "division": "Dhaka",
    "is_suburb": true,
    "thanas": [
      {
        "name": "Narayanganj Sadar",
        "name_bn": "নারায়ণগঞ্জ সদর",
        "is_suburb": true
      },
      {
        "name": "Fatullah",
        "name_bn": "ফতুল্লা",
        "is_suburb": true
      },
      {
        "name": "Siddhirganj",
        "name_bn": "সিদ্ধিরগঞ্জ",
        "is_suburb": true
      },
      {
        "name": "Bandar",
        "name_bn": "বন্দর",
        "is_suburb": true
      },
      {
        "name": "Rupganj",
        "name_bn": "রূপগঞ্জ",
        "is_suburb": true
      },
      {
        "name": "Sonargaon",
        "name_bn": "সোনারগাঁও",
        "is_suburb": true
      },
      {
        "name": "Araihazar",
        "name_bn": "আড়াইহাজার",
        "is_suburb": true
      }
    ]
  },
  {
    "name": "Narsingdi",
    "name_bn": "নরসিংদী",
    "division": "Dhaka",
    "thanas": [
      {
        "name": "Narsingdi Sadar",
        "name_bn": "নরসিংদী সদর"
      },
      {
        "name": "Palash",
        "name_bn": "পলাশ"
      },
      {
        "name": "Shibpur",
        "name_bn": "শিবপুর"
      },
      {
        "name": "Monohardi",
        "name_bn": "মনোহরদী"
      },
      {
        "name": "Belabo",
        "name_bn": "বেলাবো"
      },
      {
        "name": "Raipura",
        "name_bn": "রায়পুরা"
      }
    ]
  },
  {
    "name": "Manikganj",
    "name_bn": "মানিকগঞ্জ",
    "division": "Dhaka",
    "thanas": [
      {
        "name": "Manikganj Sadar",
        "name_bn": "মানিকগঞ্জ সদর"
      },
      {
        "name": "Singair",
        "name_bn": "সিংগাইর"
      },
      {
        "name": "Saturia",
        "name_bn": "সাটুরিয়া"
      },
      {
        "name": "Shivalaya",
        "name_bn": "শিবালয়"
      },
      {
        "name": "Ghior",
        "name_bn": "ঘিওর"
      },
      {
        "name": "Harirampur",
        "name_bn": "হরিরামপুর"
      },
      {
        "name": "Daulatpur",
        "name_bn": "দৌলতপুর"
      }
    ]
  },
  {
    "name": "Munshiganj",
    "name_bn": "মুন্সীগঞ্জ",
    "division": "Dhaka",
    "thanas": [
      {
        "name": "Munshiganj Sadar",
        "name_bn": "মুন্সীগঞ্জ সদর"
      },
      {
        "name": "Sreenagar",
        "name_bn": "শ্রীনগর"
      },
      {
        "name": "Sirajdikhan",
        "name_bn": "সিরাজদিখান"
      },
      {
        "name": "Louhajang",
        "name_bn": "লৌহজং"
      },
      {
        "name": "Tongibari",
        "name_bn": "টঙ্গীবাড়ী"
      },
      {
        "name": "Gazaria",
        "name_bn": "গজারিয়া"
      }
    ]
  },
  {
    "name": "Faridpur",
    "name_bn": "ফরিদপুর",
    "division": "Dhaka",
    "thanas": [
      {
        "name": "Faridpur Sadar",
        "name_bn": "ফরিদপুর সদর"
      },
      {
        "name": "Boalmari",
        "name_bn": "বোয়ালমারী"
      },
      {
        "name": "Alfadanga",
        "name_bn": "আলফাডাঙ্গা"
      },
      {
        "name": "Madhukhali",
        "name_bn": "মধুখালী"
      },
      {
        "name": "Bhanga",
        "name_bn": "ভাঙ্গা"
      },
      {
        "name": "Nagarkanda",
        "name_bn": "নগরকান্দা"
      },
      {
        "name": "Charbhadrasan",
        "name_bn": "চরভদ্রাসন"
      },
      {
        "name": "Sadarpur",
        "name_bn": "সদরপুর"
      },
      {
        "name": "Saltha",
        "name_bn": "সালথা"
      }
    ]
  },
  {
    "name": "Gopalganj",
    "name_bn": "গোপালগঞ্জ",
    "division": "Dhaka",
    "thanas": [
      {
        "name": "Gopalganj Sadar",
        "name_bn": "গোপালগঞ্জ সদর"
      },
      {
        "name": "Kashiani",
        "name_bn": "কাশিয়ানী"
      },
      {
        "name": "Kotalipara",
        "name_bn": "কোটালীপাড়া"
      },
      {
        "name": "Muksudpur",
        "name_bn": "মুকসুদপুর"
      },
      {
        "name": "Tungipara",
        "name_bn": "টুঙ্গিপাড়া"
      }
    ]
  },
  {
    "name": "Madaripur",
    "name_bn": "মাদারীপুর",
    "division": "Dhaka",
    "thanas": [
      {
        "name": "Madaripur Sadar",
        "name_bn": "মাদারীপুর সদর"
      },
      {
        "name": "Shibchar",
        "name_bn": "শিবচর"
      },
      {
        "name": "Kalkini",
        "name_bn": "কালকিনি"
      },
      {
        "name": "Rajoir",
        "name_bn": "রাজৈর"
      },
      {
        "name": "Dasar",
        "name_bn": "ডাসার"
      }
    ]
  },
  {
    "name": "Rajbari",
    "name_bn": "রাজবাড়ী",
    "division": "Dhaka",
    "thanas": [
      {
        "name": "Rajbari Sadar",
        "name_bn": "রাজবাড়ী সদর"
      },
      {
        "name": "Goalanda",
        "name_bn": "গোয়ালন্দ"
      },
      {
        "name": "Pangsha",
        "name_bn": "পাংশা"
      },
      {
        "name": "Baliakandi",
        "name_bn": "বালিয়াকান্দি"
      },
      {
        "name": "Kalukhali",
        "name_bn": "কালুখালী"
      }
    ]
  },
  {
    "name": "Shariatpur",
    "name_bn": "শরীয়তপুর",
    "division": "Dhaka",
    "thanas": [
      {
        "name": "Shariatpur Sadar",
        "name_bn": "শরীয়তপুর সদর"
      },
      {
        "name": "Naria",
        "name_bn": "নড়িয়া"
      },
      {
        "name": "Zajira",
        "name_bn": "জাজিরা"
      },
      {
        "name": "Gosairhat",
        "name_bn": "গোসাইরহাট"
      },
      {
        "name": "Bhedarganj",
        "name_bn": "ভেদরগঞ্জ"
      },
      {
        "name": "Damudya",
        "name_bn": "ডামুড্যা"
      }
    ]
  },
  {
    "name": "Tangail",
    "name_bn": "টাঙ্গাইল",
    "division": "Dhaka",
    "thanas": [
      {
        "name": "Tangail Sadar",
        "name_bn": "টাঙ্গাইল সদর"
      },
      {
        "name": "Mirzapur",
        "name_bn": "মির্জাপুর"
      },
      {
        "name": "Kalihati",
        "name_bn": "কালিহাতী"
      },
      {
        "name": "Madhupur",
        "name_bn": "মধুপুর"
      },
      {
        "name": "Gopalpur",
        "name_bn": "গোপালপুর"
      },
      {
        "name": "Ghatail",
        "name_bn": "ঘাটাইল"
      },
      {
        "name": "Sakhipur",
        "name_bn": "সখীপুর"
      },
      {
        "name": "Bhuapur",
        "name_bn": "ভূঞাপুর"
      },
      {
        "name": "Delduar",
        "name_bn": "দেলদুয়ার"
      },
      {
        "name": "Nagarpur",
        "name_bn": "নাগরপুর"
      },
      {
        "name": "Dhanbari",
        "name_bn": "ধনবাড়ী"
      },
      {
        "name": "Basail",
        "name_bn": "বাসাইল"
      }
    ]
  },
  {
    "name": "Kishoreganj",
    "name_bn": "কিশোরগঞ্জ",
    "division": "Dhaka",
    "thanas": [
      {
        "name": "Kishoreganj Sadar",
        "name_bn": "কিশোরগঞ্জ সদর"
      },
      {
        "name": "Bhairab",
        "name_bn": "ভৈরব"
      },
      {
        "name": "Bajitpur",
        "name_bn": "বাজিতপুর"
      },
      {
        "name": "Kuliarchar",
        "name_bn": "কুলিয়ারচর"
      },
      {
        "name": "Pakundia",
        "name_bn": "পাকুন্দিয়া"
      },
      {
        "name": "Katiadi",
        "name_bn": "কটিয়াদী"
      },
      {
        "name": "Karimganj",
        "name_bn": "করিমগঞ্জ"
      },
      {
        "name": "Tarail",
        "name_bn": "তাড়াইল"
      },
      {
        "name": "Hossainpur",
        "name_bn": "হোসেনপুর"
      },
      {
        "name": "Itna",
        "name_bn": "ইটনা"
      },
      {
        "name": "Mithamain",
        "name_bn": "মিঠামইন"
      },
      {
        "name": "Austagram",
        "name_bn": "অষ্টগ্রাম"
      },
      {
        "name": "Nikli",
        "name_bn": "নিকলী"
      }
    ]
  },
  {
    "name": "Chittagong (Chattogram)",
    "name_bn": "চট্টগ্রাম",
    "division": "Chittagong",
    "thanas": [
      {
        "name": "Kotwali",
        "name_bn": "কোতোয়ালী"
      },
      {
        "name": "Panchlaish",
        "name_bn": "পাঁচলাইশ"
      },
      {
        "name": "Khulshi",
        "name_bn": "খুলশী"
      },
      {
        "name": "Agrabad / Double Mooring",
        "name_bn": "আগ্রাবাদ / ডবলমুরিং"
      },
      {
        "name": "Halishahar",
        "name_bn": "হালিশহর"
      },
      {
        "name": "Pahartali",
        "name_bn": "পাহাড়তলী"
      },
      {
        "name": "Bakalia",
        "name_bn": "বাকলিয়া"
      },
      {
        "name": "Patenga",
        "name_bn": "পতেঙ্গা"
      },
      {
        "name": "Chandgaon",
        "name_bn": "চান্দগাঁও"
      },
      {
        "name": "Hathazari",
        "name_bn": "হাটহাজারী"
      },
      {
        "name": "Raozan",
        "name_bn": "রাউজান"
      },
      {
        "name": "Rangunia",
        "name_bn": "রাঙ্গুনিয়া"
      },
      {
        "name": "Fatikchhari",
        "name_bn": "ফটিকছড়ি"
      },
      {
        "name": "Sitakunda",
        "name_bn": "সীতাকুণ্ড"
      },
      {
        "name": "Mirsharai",
        "name_bn": "মীরসরাই"
      },
      {
        "name": "Patiya",
        "name_bn": "পটিয়া"
      },
      {
        "name": "Boalkhali",
        "name_bn": "বোয়ালখালী"
      },
      {
        "name": "Anwara",
        "name_bn": "আনোয়ারা"
      },
      {
        "name": "Chandanaish",
        "name_bn": "চন্দনাইশ"
      },
      {
        "name": "Satkania",
        "name_bn": "সাতকানিয়া"
      },
      {
        "name": "Lohagara",
        "name_bn": "লোহাগাড়া"
      },
      {
        "name": "Banshkhali",
        "name_bn": "বাঁশখালী"
      },
      {
        "name": "Sandwip",
        "name_bn": "সন্দ্বীপ"
      },
      {
        "name": "Karnafuli",
        "name_bn": "কর্ণফুলী"
      }
    ]
  },
  {
    "name": "Cox's Bazar",
    "name_bn": "কক্সবাজার",
    "division": "Chittagong",
    "thanas": [
      {
        "name": "Cox's Bazar Sadar",
        "name_bn": "কক্সবাজার সদর"
      },
      {
        "name": "Chakaria",
        "name_bn": "চকোরিয়া"
      },
      {
        "name": "Teknaf",
        "name_bn": "টেকনাফ"
      },
      {
        "name": "Ukhiya",
        "name_bn": "উখিয়া"
      },
      {
        "name": "Ramu",
        "name_bn": "রামু"
      },
      {
        "name": "Pekua",
        "name_bn": "পেকুয়া"
      },
      {
        "name": "Maheshkhali",
        "name_bn": "মহেশখালী"
      },
      {
        "name": "Kutubdia",
        "name_bn": "কুতুবদিয়া"
      }
    ]
  },
  {
    "name": "Cumilla (Comilla)",
    "name_bn": "কুমিল্লা",
    "division": "Chittagong",
    "thanas": [
      {
        "name": "Cumilla Adarsha Sadar",
        "name_bn": "কুমিল্লা আদর্শ সদর"
      },
      {
        "name": "Cumilla Sadar Dakshin",
        "name_bn": "কুমিল্লা সদর দক্ষিণ"
      },
      {
        "name": "Laksam",
        "name_bn": "লাকসাম"
      },
      {
        "name": "Debidwar",
        "name_bn": "দেবীদ্বার"
      },
      {
        "name": "Daudkandi",
        "name_bn": "দাউদকান্দি"
      },
      {
        "name": "Chandina",
        "name_bn": "চান্দিনা"
      },
      {
        "name": "Muradnagar",
        "name_bn": "মুরাদনগর"
      },
      {
        "name": "Homna",
        "name_bn": "হোমনা"
      },
      {
        "name": "Barura",
        "name_bn": "বরুড়া"
      },
      {
        "name": "Burichang",
        "name_bn": "বুড়িচং"
      },
      {
        "name": "Brahmanpara",
        "name_bn": "ব্রাহ্মণপাড়া"
      },
      {
        "name": "Chauddagram",
        "name_bn": "চৌদ্দগ্রাম"
      },
      {
        "name": "Nangalkot",
        "name_bn": "নাঙ্গলকোট"
      },
      {
        "name": "Titas",
        "name_bn": "তিতাস"
      },
      {
        "name": "Meghna",
        "name_bn": "মেঘনা"
      },
      {
        "name": "Monohargonj",
        "name_bn": "মনোহরগঞ্জ"
      },
      {
        "name": "Lalmai",
        "name_bn": "লালমাই"
      }
    ]
  },
  {
    "name": "Brahmanbaria",
    "name_bn": "ব্রাহ্মণবাড়িয়া",
    "division": "Chittagong",
    "thanas": [
      {
        "name": "Brahmanbaria Sadar",
        "name_bn": "ব্রাহ্মণবাড়িয়া সদর"
      },
      {
        "name": "Ashuganj",
        "name_bn": "আশুগঞ্জ"
      },
      {
        "name": "Sarail",
        "name_bn": "সরাইল"
      },
      {
        "name": "Kasba",
        "name_bn": "কসবা"
      },
      {
        "name": "Akhaura",
        "name_bn": "আখাউড়া"
      },
      {
        "name": "Nabinagar",
        "name_bn": "নবীনগর"
      },
      {
        "name": "Bancharampur",
        "name_bn": "বাঞ্ছারামপুর"
      },
      {
        "name": "Nasirnagar",
        "name_bn": "নাসিরনগর"
      },
      {
        "name": "Bijoynagar",
        "name_bn": "বিজয়নগর"
      }
    ]
  },
  {
    "name": "Chandpur",
    "name_bn": "চাঁদপুর",
    "division": "Chittagong",
    "thanas": [
      {
        "name": "Chandpur Sadar",
        "name_bn": "চাঁদপুর সদর"
      },
      {
        "name": "Hajiganj",
        "name_bn": "হাজীগঞ্জ"
      },
      {
        "name": "Matlab Dakshin",
        "name_bn": "মতলব দক্ষিণ"
      },
      {
        "name": "Matlab Uttar",
        "name_bn": "মতলব উত্তর"
      },
      {
        "name": "Shahrasti",
        "name_bn": "শাহরাস্তি"
      },
      {
        "name": "Faridganj",
        "name_bn": "ফরিদগঞ্জ"
      },
      {
        "name": "Haimchar",
        "name_bn": "হাইমচর"
      },
      {
        "name": "Kachua",
        "name_bn": "কচুয়া"
      }
    ]
  },
  {
    "name": "Noakhali",
    "name_bn": "নোয়াখালী",
    "division": "Chittagong",
    "thanas": [
      {
        "name": "Noakhali Sadar (Sudharam)",
        "name_bn": "নোয়াখালী সদর (সুধারাম)"
      },
      {
        "name": "Begumganj (Chowmuhani)",
        "name_bn": "বেগমগঞ্জ (চৌমুহনী)"
      },
      {
        "name": "Senbagh",
        "name_bn": "সেনবাগ"
      },
      {
        "name": "Chatkhil",
        "name_bn": "চাটখিল"
      },
      {
        "name": "Sonaimuri",
        "name_bn": "সোনাইমুড়ী"
      },
      {
        "name": "Companiganj",
        "name_bn": "কোম্পানীগঞ্জ"
      },
      {
        "name": "Hatiya",
        "name_bn": "হাতিয়া"
      },
      {
        "name": "Subarnachar",
        "name_bn": "সুবর্ণচর"
      },
      {
        "name": "Kabirhat",
        "name_bn": "কবিরহাট"
      }
    ]
  },
  {
    "name": "Feni",
    "name_bn": "ফেনী",
    "division": "Chittagong",
    "thanas": [
      {
        "name": "Feni Sadar",
        "name_bn": "ফেনী সদর"
      },
      {
        "name": "Daganbhuiyan",
        "name_bn": "দাগনভূঁঞা"
      },
      {
        "name": "Chhagalnaiya",
        "name_bn": "ছাগলনাইয়া"
      },
      {
        "name": "Sonagazi",
        "name_bn": "সোনাগাজী"
      },
      {
        "name": "Parshuram",
        "name_bn": "পরশুরাম"
      },
      {
        "name": "Fulgazi",
        "name_bn": "ফুলগাজী"
      }
    ]
  },
  {
    "name": "Lakshmipur",
    "name_bn": "লক্ষ্মীপুর",
    "division": "Chittagong",
    "thanas": [
      {
        "name": "Lakshmipur Sadar",
        "name_bn": "লক্ষ্মীপুর সদর"
      },
      {
        "name": "Raipur",
        "name_bn": "রায়পুর"
      },
      {
        "name": "Ramganj",
        "name_bn": "রামগঞ্জ"
      },
      {
        "name": "Ramgati",
        "name_bn": "রামগতি"
      },
      {
        "name": "Kamalnagar",
        "name_bn": "কমলনগর"
      }
    ]
  },
  {
    "name": "Rangamati",
    "name_bn": "রাঙ্গামাটি",
    "division": "Chittagong",
    "thanas": [
      {
        "name": "Rangamati Sadar",
        "name_bn": "রাঙ্গামাটি সদর"
      },
      {
        "name": "Kaptai",
        "name_bn": "কাপ্তাই"
      },
      {
        "name": "Kawkhali",
        "name_bn": "কাউখালী"
      },
      {
        "name": "Baghaichhari",
        "name_bn": "বাঘাইছড়ি"
      },
      {
        "name": "Barkal",
        "name_bn": "বরকল"
      },
      {
        "name": "Langadu",
        "name_bn": "লংগদু"
      },
      {
        "name": "Rajasthali",
        "name_bn": "রাজস্থলী"
      },
      {
        "name": "Belaichhari",
        "name_bn": "বিলাইছড়ি"
      },
      {
        "name": "Juraichhari",
        "name_bn": "জুরাইছড়ি"
      },
      {
        "name": "Naniarchar",
        "name_bn": "নানিয়ারচর"
      }
    ]
  },
  {
    "name": "Bandarban",
    "name_bn": "বান্দরবান",
    "division": "Chittagong",
    "thanas": [
      {
        "name": "Bandarban Sadar",
        "name_bn": "বান্দরবান সদর"
      },
      {
        "name": "Ruma",
        "name_bn": "রুমা"
      },
      {
        "name": "Thanchi",
        "name_bn": "থানচি"
      },
      {
        "name": "Rowangchhari",
        "name_bn": "রোয়াংছড়ি"
      },
      {
        "name": "Lama",
        "name_bn": "লামা"
      },
      {
        "name": "Alikadam",
        "name_bn": "আলীকদম"
      },
      {
        "name": "Naikhongchhari",
        "name_bn": "নাইক্ষ্যংছড়ি"
      }
    ]
  },
  {
    "name": "Khagrachhari",
    "name_bn": "খাগড়াছড়ি",
    "division": "Chittagong",
    "thanas": [
      {
        "name": "Khagrachhari Sadar",
        "name_bn": "খাগড়াছড়ি সদর"
      },
      {
        "name": "Dighinala",
        "name_bn": "দিঘীনালা"
      },
      {
        "name": "Panchhari",
        "name_bn": "পানছড়ি"
      },
      {
        "name": "Mahalchhari",
        "name_bn": "মহালছড়ি"
      },
      {
        "name": "Matiranga",
        "name_bn": "মাটিরাঙ্গা"
      },
      {
        "name": "Manikchhari",
        "name_bn": "মানিকছড়ি"
      },
      {
        "name": "Ramgarh",
        "name_bn": "রামগড়"
      },
      {
        "name": "Lakshmichhari",
        "name_bn": "লক্ষ্মীছড়ি"
      },
      {
        "name": "Guimara",
        "name_bn": "গুইমারা"
      }
    ]
  },
  {
    "name": "Sylhet",
    "name_bn": "সিলেট",
    "division": "Sylhet",
    "thanas": [
      {
        "name": "Sylhet Sadar",
        "name_bn": "সিলেট সদর"
      },
      {
        "name": "Kotwali",
        "name_bn": "কোতোয়ালী"
      },
      {
        "name": "Shah Paran",
        "name_bn": "শাহপরান"
      },
      {
        "name": "South Surma",
        "name_bn": "দক্ষিণ সুরমা"
      },
      {
        "name": "Beanibazar",
        "name_bn": "বিয়ানীবাজার"
      },
      {
        "name": "Golapganj",
        "name_bn": "গোলাপগঞ্জ"
      },
      {
        "name": "Osmani Nagar",
        "name_bn": "ওসমানী নগর"
      },
      {
        "name": "Bishwanath",
        "name_bn": "বিশ্বনাথ"
      },
      {
        "name": "Balaganj",
        "name_bn": "বালাগঞ্জ"
      },
      {
        "name": "Fenchuganj",
        "name_bn": "ফেঞ্চুগঞ্জ"
      },
      {
        "name": "Zakiganj",
        "name_bn": "জকিগঞ্জ"
      },
      {
        "name": "Kanaighat",
        "name_bn": "কানাইঘাট"
      },
      {
        "name": "Gowainghat",
        "name_bn": "গোয়াইনঘাট"
      },
      {
        "name": "Jaintiapur",
        "name_bn": "জৈন্তাপুর"
      },
      {
        "name": "Companiganj",
        "name_bn": "কোম্পানীগঞ্জ"
      }
    ]
  },
  {
    "name": "Moulvibazar",
    "name_bn": "মৌলভীবাজার",
    "division": "Sylhet",
    "thanas": [
      {
        "name": "Moulvibazar Sadar",
        "name_bn": "মৌলভীবাজার সদর"
      },
      {
        "name": "Sreemangal",
        "name_bn": "শ্রীমঙ্গল"
      },
      {
        "name": "Kamalganj",
        "name_bn": "কমলগঞ্জ"
      },
      {
        "name": "Kulaura",
        "name_bn": "কুলাউড়া"
      },
      {
        "name": "Rajnagar",
        "name_bn": "রাজনগর"
      },
      {
        "name": "Barlekha",
        "name_bn": "বড়লেখা"
      },
      {
        "name": "Juri",
        "name_bn": "জুড়ী"
      }
    ]
  },
  {
    "name": "Habiganj",
    "name_bn": "হবিগঞ্জ",
    "division": "Sylhet",
    "thanas": [
      {
        "name": "Habiganj Sadar",
        "name_bn": "হবিগঞ্জ সদর"
      },
      {
        "name": "Nabiganj",
        "name_bn": "নবীগঞ্জ"
      },
      {
        "name": "Madhabpur",
        "name_bn": "মাধবপুর"
      },
      {
        "name": "Chunarughat",
        "name_bn": "চুনারুঘাট"
      },
      {
        "name": "Bahubal",
        "name_bn": "বাহুবল"
      },
      {
        "name": "Baniachong",
        "name_bn": "বানিয়াচং"
      },
      {
        "name": "Ajmiriganj",
        "name_bn": "আজমিরীগঞ্জ"
      },
      {
        "name": "Lakhai",
        "name_bn": "লাখাই"
      },
      {
        "name": "Shayestaganj",
        "name_bn": "শায়েস্তাগঞ্জ"
      }
    ]
  },
  {
    "name": "Sunamganj",
    "name_bn": "সুনামগঞ্জ",
    "division": "Sylhet",
    "thanas": [
      {
        "name": "Sunamganj Sadar",
        "name_bn": "সুনামগঞ্জ সদর"
      },
      {
        "name": "Chhatak",
        "name_bn": "ছাতক"
      },
      {
        "name": "Jagannathpur",
        "name_bn": "জগন্নাথপুর"
      },
      {
        "name": "Derai",
        "name_bn": "দিরাই"
      },
      {
        "name": "Tahirpur",
        "name_bn": "তাহিরপুর"
      },
      {
        "name": "Dharampasha",
        "name_bn": "ধর্মপাশা"
      },
      {
        "name": "Jamalganj",
        "name_bn": "জামালগঞ্জ"
      },
      {
        "name": "Shalla",
        "name_bn": "শাল্লা"
      },
      {
        "name": "Bishwambharpur",
        "name_bn": "বিশ্বম্ভরপুর"
      },
      {
        "name": "Dowarabazar",
        "name_bn": "দোয়ারাবাজার"
      },
      {
        "name": "South Sunamganj (Shantiganj)",
        "name_bn": "শান্তিগঞ্জ"
      },
      {
        "name": "Madhyanagar",
        "name_bn": "মধ্যনগর"
      }
    ]
  },
  {
    "name": "Rajshahi",
    "name_bn": "রাজশাহী",
    "division": "Rajshahi",
    "thanas": [
      {
        "name": "Boalia",
        "name_bn": "বোয়ালিয়া"
      },
      {
        "name": "Rajpara",
        "name_bn": "রাজপাড়া"
      },
      {
        "name": "Motihar",
        "name_bn": "মতিহার"
      },
      {
        "name": "Shah Makhdum",
        "name_bn": "শাহ মখদুম"
      },
      {
        "name": "Chandrima",
        "name_bn": "চন্দ্রিমা"
      },
      {
        "name": "Kashiadanga",
        "name_bn": "কাটাখালী"
      },
      {
        "name": "Paba",
        "name_bn": "পবা"
      },
      {
        "name": "Godagari",
        "name_bn": "গোদাগাড়ী"
      },
      {
        "name": "Tanore",
        "name_bn": "তানোর"
      },
      {
        "name": "Bagmara",
        "name_bn": "বাগমারা"
      },
      {
        "name": "Durgapur",
        "name_bn": "দুর্গাপুর"
      },
      {
        "name": "Puthia",
        "name_bn": "পুঠিয়া"
      },
      {
        "name": "Charghat",
        "name_bn": "চারঘাট"
      },
      {
        "name": "Bagha",
        "name_bn": "বাঘা"
      },
      {
        "name": "Mohanpur",
        "name_bn": "মোহনপুর"
      }
    ]
  },
  {
    "name": "Bogura (Bogra)",
    "name_bn": "বগুড়া",
    "division": "Rajshahi",
    "thanas": [
      {
        "name": "Bogura Sadar",
        "name_bn": "বগুড়া সদর"
      },
      {
        "name": "Sherpur",
        "name_bn": "শেরপুর"
      },
      {
        "name": "Shajahanpur",
        "name_bn": "শাজাহানপুর"
      },
      {
        "name": "Gabtali",
        "name_bn": "গাবতলী"
      },
      {
        "name": "Sariakandi",
        "name_bn": "সারিয়াকান্দি"
      },
      {
        "name": "Dhunat",
        "name_bn": "ধুনট"
      },
      {
        "name": "Kahaloo",
        "name_bn": "কাহালু"
      },
      {
        "name": "Nandigram",
        "name_bn": "নন্দীগ্রাম"
      },
      {
        "name": "Dupchanchia",
        "name_bn": "দুপচাঁচিয়া"
      },
      {
        "name": "Adamdighi",
        "name_bn": "আদমদীঘি"
      },
      {
        "name": "Shibganj",
        "name_bn": "শিবগঞ্জ"
      },
      {
        "name": "Sonatola",
        "name_bn": "সোনাতলা"
      }
    ]
  },
  {
    "name": "Pabna",
    "name_bn": "পাবনা",
    "division": "Rajshahi",
    "thanas": [
      {
        "name": "Pabna Sadar",
        "name_bn": "পাবনা সদর"
      },
      {
        "name": "Ishwardi",
        "name_bn": "ঈশ্বরদী"
      },
      {
        "name": "Atgharia",
        "name_bn": "আটঘরিয়া"
      },
      {
        "name": "Chatmohar",
        "name_bn": "চাটমোহর"
      },
      {
        "name": "Bhangura",
        "name_bn": "ভাঙ্গুড়া"
      },
      {
        "name": "Faridpur",
        "name_bn": "ফরিদপুর"
      },
      {
        "name": "Sujanagar",
        "name_bn": "সুজানগর"
      },
      {
        "name": "Bera",
        "name_bn": "বেড়া"
      },
      {
        "name": "Santhia",
        "name_bn": "সাঁথিয়া"
      }
    ]
  },
  {
    "name": "Sirajganj",
    "name_bn": "সিরাজগঞ্জ",
    "division": "Rajshahi",
    "thanas": [
      {
        "name": "Sirajganj Sadar",
        "name_bn": "সিরাজগঞ্জ সদর"
      },
      {
        "name": "Shahjadpur",
        "name_bn": "শাহজাদপুর"
      },
      {
        "name": "Ullapara",
        "name_bn": "উল্লাপাড়া"
      },
      {
        "name": "Belkuchi",
        "name_bn": "বেলকুচি"
      },
      {
        "name": "Kazipur",
        "name_bn": "কাজীপুর"
      },
      {
        "name": "Tarash",
        "name_bn": "তাড়াশ"
      },
      {
        "name": "Rayganj",
        "name_bn": "রায়গঞ্জ"
      },
      {
        "name": "Kamarkhanda",
        "name_bn": "কামারখন্দ"
      },
      {
        "name": "Chauhali",
        "name_bn": "চৌহালী"
      }
    ]
  },
  {
    "name": "Naogaon",
    "name_bn": "নওগাঁ",
    "division": "Rajshahi",
    "thanas": [
      {
        "name": "Naogaon Sadar",
        "name_bn": "নওগাঁ সদর"
      },
      {
        "name": "Patnitala",
        "name_bn": "পত্নীতলা"
      },
      {
        "name": "Dhamoirhat",
        "name_bn": "ধামইরহাট"
      },
      {
        "name": "Mohadevpur",
        "name_bn": "মহাদেবপুর"
      },
      {
        "name": "Manda",
        "name_bn": "মান্দা"
      },
      {
        "name": "Niamatpur",
        "name_bn": "নিয়ামতপুর"
      },
      {
        "name": "Raninagar",
        "name_bn": "রাণীনগর"
      },
      {
        "name": "Atrai",
        "name_bn": "আত্রাই"
      },
      {
        "name": "Badalgachhi",
        "name_bn": "বদলগাছী"
      },
      {
        "name": "Sapahar",
        "name_bn": "সাপাহার"
      },
      {
        "name": "Porsha",
        "name_bn": "পোরশা"
      }
    ]
  },
  {
    "name": "Natore",
    "name_bn": "নাটোর",
    "division": "Rajshahi",
    "thanas": [
      {
        "name": "Natore Sadar",
        "name_bn": "নাটোর সদর"
      },
      {
        "name": "Singra",
        "name_bn": "সিংড়া"
      },
      {
        "name": "Baraigram",
        "name_bn": "বড়াইগ্রাম"
      },
      {
        "name": "Bagatipara",
        "name_bn": "বাগাতিপাড়া"
      },
      {
        "name": "Lalpur",
        "name_bn": "লালপুর"
      },
      {
        "name": "Gurudaspur",
        "name_bn": "গুরুদাসপুর"
      },
      {
        "name": "Naldanga",
        "name_bn": "নলডাঙ্গা"
      }
    ]
  },
  {
    "name": "Chapai Nawabganj",
    "name_bn": "চাঁপাইনবাবগঞ্জ",
    "division": "Rajshahi",
    "thanas": [
      {
        "name": "Chapai Nawabganj Sadar",
        "name_bn": "চাঁপাইনবাবগঞ্জ সদর"
      },
      {
        "name": "Shibganj",
        "name_bn": "শিবগঞ্জ"
      },
      {
        "name": "Gomostapur",
        "name_bn": "গোমস্তাপুর"
      },
      {
        "name": "Nachole",
        "name_bn": "নাচোল"
      },
      {
        "name": "Bholahat",
        "name_bn": "ভোলাহাট"
      }
    ]
  },
  {
    "name": "Joypurhat",
    "name_bn": "জয়পুরহাট",
    "division": "Rajshahi",
    "thanas": [
      {
        "name": "Joypurhat Sadar",
        "name_bn": "জয়পুরহাট সদর"
      },
      {
        "name": "Panchbibi",
        "name_bn": "পাঁচবিবি"
      },
      {
        "name": "Kalai",
        "name_bn": "কালাই"
      },
      {
        "name": "Khetlal",
        "name_bn": "ক্ষেতলাল"
      },
      {
        "name": "Akkelpur",
        "name_bn": "আক্কেলপুর"
      }
    ]
  },
  {
    "name": "Khulna",
    "name_bn": "খুলনা",
    "division": "Khulna",
    "thanas": [
      {
        "name": "Khulna Sadar",
        "name_bn": "খুলনা সদর"
      },
      {
        "name": "Sonadanga",
        "name_bn": "সোনাডাঙ্গা"
      },
      {
        "name": "Khalishpur",
        "name_bn": "খালিশপুর"
      },
      {
        "name": "Daulatpur",
        "name_bn": "দৌলতপুর"
      },
      {
        "name": "Khan Jahan Ali",
        "name_bn": "খান জাহান আলী"
      },
      {
        "name": "Dumuria",
        "name_bn": "ডুমুরিয়া"
      },
      {
        "name": "Phultala",
        "name_bn": "ফুলতলা"
      },
      {
        "name": "Dighalia",
        "name_bn": "দিঘলিয়া"
      },
      {
        "name": "Rupsha",
        "name_bn": "রূপসা"
      },
      {
        "name": "Terokhada",
        "name_bn": "তেরখাদা"
      },
      {
        "name": "Batiaghata",
        "name_bn": "বটিয়াঘাটা"
      },
      {
        "name": "Dacope",
        "name_bn": "দাকোপ"
      },
      {
        "name": "Paikgachha",
        "name_bn": "পাইকগাছা"
      },
      {
        "name": "Koyra",
        "name_bn": "কয়রা"
      }
    ]
  },
  {
    "name": "Jashore (Jessore)",
    "name_bn": "যশোর",
    "division": "Khulna",
    "thanas": [
      {
        "name": "Jashore Sadar",
        "name_bn": "যশোর সদর"
      },
      {
        "name": "Jhikargachha",
        "name_bn": "ঝিকরগাছা"
      },
      {
        "name": "Sharsha (Benapole)",
        "name_bn": "শার্শা (বেনাপোল)"
      },
      {
        "name": "Manirampur",
        "name_bn": "মণিরামপুর"
      },
      {
        "name": "Keshabpur",
        "name_bn": "কেশবপুর"
      },
      {
        "name": "Bagherpara",
        "name_bn": "বাঘারপাড়া"
      },
      {
        "name": "Abhaynagar",
        "name_bn": "অভয়নগর"
      },
      {
        "name": "Chaugachha",
        "name_bn": "চৌগাছা"
      }
    ]
  },
  {
    "name": "Kushtia",
    "name_bn": "কুষ্টিয়া",
    "division": "Khulna",
    "thanas": [
      {
        "name": "Kushtia Sadar",
        "name_bn": "কুষ্টিয়া সদর"
      },
      {
        "name": "Kumarkhali",
        "name_bn": "কুমারখালী"
      },
      {
        "name": "Bheramara",
        "name_bn": "ভেড়ামারা"
      },
      {
        "name": "Mirpur",
        "name_bn": "মিরপুর"
      },
      {
        "name": "Daulatpur",
        "name_bn": "দৌলতপুর"
      },
      {
        "name": "Khoksa",
        "name_bn": "খোকসা"
      }
    ]
  },
  {
    "name": "Satkhira",
    "name_bn": "সাতক্ষীরা",
    "division": "Khulna",
    "thanas": [
      {
        "name": "Satkhira Sadar",
        "name_bn": "সাতক্ষীরা সদর"
      },
      {
        "name": "Kalaroa",
        "name_bn": "কলারোয়া"
      },
      {
        "name": "Tala",
        "name_bn": "তালা"
      },
      {
        "name": "Debhata",
        "name_bn": "দেবহাটা"
      },
      {
        "name": "Kaliganj",
        "name_bn": "কালীগঞ্জ"
      },
      {
        "name": "Assasuni",
        "name_bn": "আশাশুনি"
      },
      {
        "name": "Shyamnagar",
        "name_bn": "শ্যামনগর"
      }
    ]
  },
  {
    "name": "Bagerhat",
    "name_bn": "বাগেরহাট",
    "division": "Khulna",
    "thanas": [
      {
        "name": "Bagerhat Sadar",
        "name_bn": "বাগেরহাট সদর"
      },
      {
        "name": "Mongla",
        "name_bn": "মোংলা"
      },
      {
        "name": "Fakirhat",
        "name_bn": "ফকিরহাট"
      },
      {
        "name": "Rampal",
        "name_bn": "রামপাল"
      },
      {
        "name": "Kachua",
        "name_bn": "কচুয়া"
      },
      {
        "name": "Mollahat",
        "name_bn": "মোল্লাহাট"
      },
      {
        "name": "Chitalmari",
        "name_bn": "চিতলমারী"
      },
      {
        "name": "Morrelganj",
        "name_bn": "মোরেলগঞ্জ"
      },
      {
        "name": "Sarankhola",
        "name_bn": "শরণখোলা"
      }
    ]
  },
  {
    "name": "Jhenaidah",
    "name_bn": "ঝিনাইদহ",
    "division": "Khulna",
    "thanas": [
      {
        "name": "Jhenaidah Sadar",
        "name_bn": "ঝিনাইদহ সদর"
      },
      {
        "name": "Kaliganj",
        "name_bn": "কালীগঞ্জ"
      },
      {
        "name": "Kotchandpur",
        "name_bn": "কোটচাঁদপুর"
      },
      {
        "name": "Maheshpur",
        "name_bn": "মহেশপুর"
      },
      {
        "name": "Shailkupa",
        "name_bn": "শৈলকুপা"
      },
      {
        "name": "Harinakunda",
        "name_bn": "হরিণাকুণ্ডু"
      }
    ]
  },
  {
    "name": "Chuadanga",
    "name_bn": "চুয়াডাঙ্গা",
    "division": "Khulna",
    "thanas": [
      {
        "name": "Chuadanga Sadar",
        "name_bn": "চুয়াডাঙ্গা সদর"
      },
      {
        "name": "Alamdanga",
        "name_bn": "আলমডাঙ্গা"
      },
      {
        "name": "Damurhuda",
        "name_bn": "দামুড়হুদা"
      },
      {
        "name": "Jibannagar",
        "name_bn": "জীবননগর"
      }
    ]
  },
  {
    "name": "Meherpur",
    "name_bn": "মেহেরপুর",
    "division": "Khulna",
    "thanas": [
      {
        "name": "Meherpur Sadar",
        "name_bn": "মেহেরপুর সদর"
      },
      {
        "name": "Gangni",
        "name_bn": "গাংনী"
      },
      {
        "name": "Mujibnagar",
        "name_bn": "মুজিবনগর"
      }
    ]
  },
  {
    "name": "Narail",
    "name_bn": "নড়াইল",
    "division": "Khulna",
    "thanas": [
      {
        "name": "Narail Sadar",
        "name_bn": "নড়াইল সদর"
      },
      {
        "name": "Lohagara",
        "name_bn": "লোহাগড়া"
      },
      {
        "name": "Kalia",
        "name_bn": "কালিয়া"
      }
    ]
  },
  {
    "name": "Magura",
    "name_bn": "মাগুরা",
    "division": "Khulna",
    "thanas": [
      {
        "name": "Magura Sadar",
        "name_bn": "মাগুরা সদর"
      },
      {
        "name": "Sreepur",
        "name_bn": "শ্রীপুর"
      },
      {
        "name": "Shalikha",
        "name_bn": "শালিখা"
      },
      {
        "name": "Mohammadpur",
        "name_bn": "মহম্মদপুর"
      }
    ]
  },
  {
    "name": "Barishal",
    "name_bn": "বরিশাল",
    "division": "Barishal",
    "thanas": [
      {
        "name": "Barishal Sadar (Kotwali)",
        "name_bn": "বরিশাল সদর (কোতোয়ালী)"
      },
      {
        "name": "Airport",
        "name_bn": "এয়ারপোর্ট"
      },
      {
        "name": "Kawnia",
        "name_bn": "কাউনিয়া"
      },
      {
        "name": "Babuganj",
        "name_bn": "বাবুগঞ্জ"
      },
      {
        "name": "Wazirpur",
        "name_bn": "উজিরপুর"
      },
      {
        "name": "Banaripara",
        "name_bn": "বানারীপাড়া"
      },
      {
        "name": "Gournadi",
        "name_bn": "গৌরনদী"
      },
      {
        "name": "Agailjhara",
        "name_bn": "আগৈলঝাড়া"
      },
      {
        "name": "Bakerganj",
        "name_bn": "বাকেরগঞ্জ"
      },
      {
        "name": "Mehendiganj",
        "name_bn": "মেহেন্দিগঞ্জ"
      },
      {
        "name": "Hizla",
        "name_bn": "হিজলা"
      },
      {
        "name": "Muladi",
        "name_bn": "মুলাদী"
      }
    ]
  },
  {
    "name": "Bhola",
    "name_bn": "ভোলা",
    "division": "Barishal",
    "thanas": [
      {
        "name": "Bhola Sadar",
        "name_bn": "ভোলা সদর"
      },
      {
        "name": "Borhanuddin",
        "name_bn": "বোরহানউদ্দিন"
      },
      {
        "name": "Daulatkhan",
        "name_bn": "দৌলতখান"
      },
      {
        "name": "Lalmohan",
        "name_bn": "লালমোহন"
      },
      {
        "name": "Tazumuddin",
        "name_bn": "তজুমদ্দিন"
      },
      {
        "name": "Char Fasson",
        "name_bn": "চরফ্যাশন"
      },
      {
        "name": "Manpura",
        "name_bn": "মনপুরা"
      }
    ]
  },
  {
    "name": "Patuakhali",
    "name_bn": "পটুয়াখালী",
    "division": "Barishal",
    "thanas": [
      {
        "name": "Patuakhali Sadar",
        "name_bn": "পটুয়াখালী সদর"
      },
      {
        "name": "Galachipa",
        "name_bn": "গলাচিপা"
      },
      {
        "name": "Kalapara (Kuakata)",
        "name_bn": "কলাপাড়া (কুয়াকাটা)"
      },
      {
        "name": "Bauphal",
        "name_bn": "বাউফল"
      },
      {
        "name": "Dashmina",
        "name_bn": "দশমিনা"
      },
      {
        "name": "Dumki",
        "name_bn": "দুমকি"
      },
      {
        "name": "Mirzaganj",
        "name_bn": "মির্জাগঞ্জ"
      },
      {
        "name": "Rangabali",
        "name_bn": "রাঙ্গাবালী"
      }
    ]
  },
  {
    "name": "Pirojpur",
    "name_bn": "পিরোজপুর",
    "division": "Barishal",
    "thanas": [
      {
        "name": "Pirojpur Sadar",
        "name_bn": "পিরোজপুর সদর"
      },
      {
        "name": "Mathbaria",
        "name_bn": "মঠবাড়িয়া"
      },
      {
        "name": "Bhandaria",
        "name_bn": "ভাণ্ডারিয়া"
      },
      {
        "name": "Nazirpur",
        "name_bn": "নাজিরপুর"
      },
      {
        "name": "Nesarabad (Swarupkathi)",
        "name_bn": "নেছারাবাদ (স্বরূপকাঠি)"
      },
      {
        "name": "Kawkhali",
        "name_bn": "কাউখালী"
      },
      {
        "name": "Zianagar (Indurkani)",
        "name_bn": "ইন্দুরকানী"
      }
    ]
  },
  {
    "name": "Barguna",
    "name_bn": "বরগুনা",
    "division": "Barishal",
    "thanas": [
      {
        "name": "Barguna Sadar",
        "name_bn": "বরগুনা সদর"
      },
      {
        "name": "Amtali",
        "name_bn": "আমতলী"
      },
      {
        "name": "Patharghata",
        "name_bn": "পাথরঘাটা"
      },
      {
        "name": "Betagi",
        "name_bn": "বেতাগী"
      },
      {
        "name": "Bamna",
        "name_bn": "বামনা"
      },
      {
        "name": "Taltali",
        "name_bn": "তালতলী"
      }
    ]
  },
  {
    "name": "Jhalokati",
    "name_bn": "ঝালকাঠি",
    "division": "Barishal",
    "thanas": [
      {
        "name": "Jhalokati Sadar",
        "name_bn": "ঝালকাঠি সদর"
      },
      {
        "name": "Nalchhiti",
        "name_bn": "নলছিটি"
      },
      {
        "name": "Rajapur",
        "name_bn": "রাজাপুর"
      },
      {
        "name": "Kathalia",
        "name_bn": "কাঠালিয়া"
      }
    ]
  },
  {
    "name": "Rangpur",
    "name_bn": "রংপুর",
    "division": "Rangpur",
    "thanas": [
      {
        "name": "Kotwali",
        "name_bn": "কোতোয়ালী"
      },
      {
        "name": "Haragach",
        "name_bn": "হারাগাছ"
      },
      {
        "name": "Mahiaganj",
        "name_bn": "মাহিগঞ্জ"
      },
      {
        "name": "Tajhat",
        "name_bn": "তাজহাট"
      },
      {
        "name": "Parshuram",
        "name_bn": "পরশুরাম"
      },
      {
        "name": "Hazirhat",
        "name_bn": "হাজিরহাট"
      },
      {
        "name": "Pirgachha",
        "name_bn": "পীরগাছা"
      },
      {
        "name": "Mithapukur",
        "name_bn": "মিঠাপুকুর"
      },
      {
        "name": "Pirganj",
        "name_bn": "পীরগঞ্জ"
      },
      {
        "name": "Badarganj",
        "name_bn": "বদরগঞ্জ"
      },
      {
        "name": "Kaunia",
        "name_bn": "কাউনিয়া"
      },
      {
        "name": "Gangachhara",
        "name_bn": "গঙ্গাচড়া"
      },
      {
        "name": "Taraganj",
        "name_bn": "তারাগঞ্জ"
      }
    ]
  },
  {
    "name": "Dinajpur",
    "name_bn": "দিনাজপুর",
    "division": "Rangpur",
    "thanas": [
      {
        "name": "Dinajpur Sadar",
        "name_bn": "দিনাজপুর সদর"
      },
      {
        "name": "Birganj",
        "name_bn": "বীরগঞ্জ"
      },
      {
        "name": "Kaharole",
        "name_bn": "কাহারোল"
      },
      {
        "name": "Birampur",
        "name_bn": "বিরামপুর"
      },
      {
        "name": "Phulbari",
        "name_bn": "ফুলবাড়ী"
      },
      {
        "name": "Parbatipur",
        "name_bn": "পার্বতীপুর"
      },
      {
        "name": "Bochaganj",
        "name_bn": "বোচাগঞ্জ"
      },
      {
        "name": "Nawabganj",
        "name_bn": "নবাবগঞ্জ"
      },
      {
        "name": "Ghoraghat",
        "name_bn": "ঘোড়াঘাট"
      },
      {
        "name": "Hakimpur (Hili)",
        "name_bn": "হাকিমপুর (হিলি)"
      },
      {
        "name": "Khansama",
        "name_bn": "খানসামা"
      },
      {
        "name": "Chirirbandar",
        "name_bn": "চিরিরবন্দর"
      },
      {
        "name": "Birol",
        "name_bn": "বিরল"
      }
    ]
  },
  {
    "name": "Gaibandha",
    "name_bn": "গাইবান্ধা",
    "division": "Rangpur",
    "thanas": [
      {
        "name": "Gaibandha Sadar",
        "name_bn": "গাইবান্ধা সদর"
      },
      {
        "name": "Gobindaganj",
        "name_bn": "গোবিন্দগঞ্জ"
      },
      {
        "name": "Sundarganj",
        "name_bn": "সুন্দরগঞ্জ"
      },
      {
        "name": "Palashbari",
        "name_bn": "পলাশবাড়ী"
      },
      {
        "name": "Sadullapur",
        "name_bn": "সাদুল্লাপুর"
      },
      {
        "name": "Saghata",
        "name_bn": "সাঘাটা"
      },
      {
        "name": "Phulchhari",
        "name_bn": "ফুলছড়ি"
      }
    ]
  },
  {
    "name": "Kurigram",
    "name_bn": "কুড়িগ্রাম",
    "division": "Rangpur",
    "thanas": [
      {
        "name": "Kurigram Sadar",
        "name_bn": "কুড়িগ্রাম সদর"
      },
      {
        "name": "Nageshwari",
        "name_bn": "নাগেশ্বরী"
      },
      {
        "name": "Bhurungamari",
        "name_bn": "ভুরুঙ্গামারী"
      },
      {
        "name": "Ulipur",
        "name_bn": "উলিপুর"
      },
      {
        "name": "Chilmari",
        "name_bn": "চিলমারী"
      },
      {
        "name": "Rajarhat",
        "name_bn": "রাজারহাট"
      },
      {
        "name": "Rowmari",
        "name_bn": "রৌমারী"
      },
      {
        "name": "Char Rajibpur",
        "name_bn": "চর রাজিবপুর"
      },
      {
        "name": "Phulbari",
        "name_bn": "ফুলবাড়ী"
      }
    ]
  },
  {
    "name": "Nilphamari",
    "name_bn": "নীলফামারী",
    "division": "Rangpur",
    "thanas": [
      {
        "name": "Nilphamari Sadar",
        "name_bn": "নীলফামারী সদর"
      },
      {
        "name": "Saidpur",
        "name_bn": "সৈয়দপুর"
      },
      {
        "name": "Jaldhaka",
        "name_bn": "জলঢাকা"
      },
      {
        "name": "Kishoreganj",
        "name_bn": "কিশোরগঞ্জ"
      },
      {
        "name": "Domar",
        "name_bn": "ডোমার"
      },
      {
        "name": "Dimla",
        "name_bn": "ডিমলা"
      }
    ]
  },
  {
    "name": "Panchagarh",
    "name_bn": "পঞ্চগড়",
    "division": "Rangpur",
    "thanas": [
      {
        "name": "Panchagarh Sadar",
        "name_bn": "পঞ্চগড় সদর"
      },
      {
        "name": "Tetulia",
        "name_bn": "তেঁতুলিয়া"
      },
      {
        "name": "Debiganj",
        "name_bn": "দেবীগঞ্জ"
      },
      {
        "name": "Boda",
        "name_bn": "বোদা"
      },
      {
        "name": "Atwari",
        "name_bn": "আটোয়ারী"
      }
    ]
  },
  {
    "name": "Thakurgaon",
    "name_bn": "ঠাকুরগাঁও",
    "division": "Rangpur",
    "thanas": [
      {
        "name": "Thakurgaon Sadar",
        "name_bn": "ঠাকুরগাঁও সদর"
      },
      {
        "name": "Pirganj",
        "name_bn": "পীরগঞ্জ"
      },
      {
        "name": "Ranisankail",
        "name_bn": "রাণীশংকৈল"
      },
      {
        "name": "Baliadangi",
        "name_bn": "বালিয়াডাঙ্গী"
      },
      {
        "name": "Haripur",
        "name_bn": "হরিপুর"
      }
    ]
  },
  {
    "name": "Lalmonirhat",
    "name_bn": "লালমনিরহাট",
    "division": "Rangpur",
    "thanas": [
      {
        "name": "Lalmonirhat Sadar",
        "name_bn": "লালমনিরহাট সদর"
      },
      {
        "name": "Patgram (Burimari)",
        "name_bn": "পাটগ্রাম (বুড়িমারী)"
      },
      {
        "name": "Hatibandha",
        "name_bn": "হাতীবান্ধা"
      },
      {
        "name": "Kaliganj",
        "name_bn": "কালীগঞ্জ"
      },
      {
        "name": "Aditmari",
        "name_bn": "আদিতমারী"
      }
    ]
  },
  {
    "name": "Mymensingh",
    "name_bn": "ময়মনসিংহ",
    "division": "Mymensingh",
    "thanas": [
      {
        "name": "Kotwali",
        "name_bn": "কোতোয়ালী"
      },
      {
        "name": "Muktagachha",
        "name_bn": "মুক্তাগাছা"
      },
      {
        "name": "Trishal",
        "name_bn": "ত্রিশাল"
      },
      {
        "name": "Bhaluka",
        "name_bn": "ভালুকা"
      },
      {
        "name": "Gafargaon",
        "name_bn": "গফরগাঁও"
      },
      {
        "name": "Fulbaria",
        "name_bn": "ফুলবাড়ীয়া"
      },
      {
        "name": "Ishwarganj",
        "name_bn": "ঈশ্বরগঞ্জ"
      },
      {
        "name": "Nandail",
        "name_bn": "নান্দাইল"
      },
      {
        "name": "Gouripur",
        "name_bn": "গৌরীপুর"
      },
      {
        "name": "Phulpur",
        "name_bn": "ফুলপুর"
      },
      {
        "name": "Haluaghat",
        "name_bn": "হালুয়াঘাট"
      },
      {
        "name": "Dhobaura",
        "name_bn": "ধোবাউড়া"
      },
      {
        "name": "Tara Khanda",
        "name_bn": "তারাকান্দা"
      }
    ]
  },
  {
    "name": "Jamalpur",
    "name_bn": "জামালপুর",
    "division": "Mymensingh",
    "thanas": [
      {
        "name": "Jamalpur Sadar",
        "name_bn": "জামালপুর সদর"
      },
      {
        "name": "Sarishabari",
        "name_bn": "সরিষাবাড়ী"
      },
      {
        "name": "Melandaha",
        "name_bn": "মেলান্দহ"
      },
      {
        "name": "Islampur",
        "name_bn": "ইসলামপুর"
      },
      {
        "name": "Dewanganj",
        "name_bn": "দেওয়ানগঞ্জ"
      },
      {
        "name": "Madarganj",
        "name_bn": "মাদারগঞ্জ"
      },
      {
        "name": "Bakshiganj",
        "name_bn": "বকশীগঞ্জ"
      }
    ]
  },
  {
    "name": "Netrokona",
    "name_bn": "নেত্রকোণা",
    "division": "Mymensingh",
    "thanas": [
      {
        "name": "Netrokona Sadar",
        "name_bn": "নেত্রকোণা সদর"
      },
      {
        "name": "Kendua",
        "name_bn": "কেন্দুয়া"
      },
      {
        "name": "Mohanganj",
        "name_bn": "মোহনগঞ্জ"
      },
      {
        "name": "Durgapur",
        "name_bn": "দুর্গাপুর"
      },
      {
        "name": "Purbadhala",
        "name_bn": "পূর্বধলা"
      },
      {
        "name": "Barhatta",
        "name_bn": "বারহাট্টা"
      },
      {
        "name": "Kalmakanda",
        "name_bn": "কলমাকান্দা"
      },
      {
        "name": "Atpara",
        "name_bn": "আটপাড়া"
      },
      {
        "name": "Madan",
        "name_bn": "মদন"
      },
      {
        "name": "Khaliajuri",
        "name_bn": "খালিয়াজুড়ি"
      }
    ]
  },
  {
    "name": "Sherpur",
    "name_bn": "শেরপুর",
    "division": "Mymensingh",
    "thanas": [
      {
        "name": "Sherpur Sadar",
        "name_bn": "শেরপুর সদর"
      },
      {
        "name": "Nalitabari",
        "name_bn": "নালিতাবাড়ী"
      },
      {
        "name": "Nakla",
        "name_bn": "নকলা"
      },
      {
        "name": "Jhenaigati",
        "name_bn": "ঝিনাইগাতী"
      },
      {
        "name": "Sreebardi",
        "name_bn": "শ্রীবরদী"
      }
    ]
  }
];

export const calculateBangladeshShipping = (districtName: string, thanaName: string) => {
  const district = BANGLADESH_DISTRICTS.find(
    (d) => d.name.toLowerCase() === (districtName || '').toLowerCase()
  );

  if (!district) {
    return {
      fee: 130,
      zone: 'outside_dhaka' as const,
      zoneLabel: 'Outside Dhaka (All Districts)',
      zoneLabelBn: 'ঢাকার বাইরে (সকল জেলা)',
      deliveryTime: '48-72 Hours',
    };
  }

  // Check if Dhaka
  if (district.name === 'Dhaka') {
    const thana = district.thanas.find(
      (t) => t.name.toLowerCase() === (thanaName || '').toLowerCase()
    );

    const isSuburb = thana?.is_suburb || 
      ['savar', 'dhamrai', 'keraniganj', 'nawabganj', 'dohar'].includes((thanaName || '').toLowerCase());

    if (isSuburb) {
      return {
        fee: 100,
        zone: 'suburb' as const,
        zoneLabel: 'Dhaka Suburbs (Savar / Keraniganj / Dhamrai)',
        zoneLabelBn: 'ঢাকার পার্শ্ববর্তী এলাকা (সাভার / কেরানীগঞ্জ)',
        deliveryTime: '24-48 Hours',
      };
    }

    return {
      fee: 80,
      zone: 'inside_dhaka' as const,
      zoneLabel: 'Inside Dhaka City (Express)',
      zoneLabelBn: 'ঢাকার ভিতরে (এক্সপ্রেস)',
      deliveryTime: '24 Hours',
    };
  }

  // Check if Gazipur or Narayanganj Suburbs
  if (district.name === 'Gazipur' || district.name === 'Narayanganj') {
    return {
      fee: 100,
      zone: 'suburb' as const,
      zoneLabel: district.name + ' Suburbs',
      zoneLabelBn: district.name_bn + ' উপশহর',
      deliveryTime: '24-48 Hours',
    };
  }

  // All other 61 Districts
  return {
    fee: 130,
    zone: 'outside_dhaka' as const,
    zoneLabel: district.name + ' District (Nationwide)',
    zoneLabelBn: district.name_bn + ' জেলা (সারা বাংলাদেশ)',
    deliveryTime: '48-72 Hours',
  };
};
