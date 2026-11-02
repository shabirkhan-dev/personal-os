/**
 * Ayahs for the Ayah of the day card, chosen to be short enough to read in a glance.
 *
 * Generated from quran-json 3.1.2 (https://github.com/risan/quran-json), CC BY-SA 4.0: Uthmani
 * text from The Noble Qur'an Encyclopedia (quranenc.com) and the Saheeh International English
 * translation from tanzil.net. Do not edit the text by hand; regenerate it instead.
 */

export type Ayah = {
	/** "surah:ayah", e.g. "94:5". */
	id: string;
	surah: string;
	arabic: string;
	translation: string;
	/** What it speaks to, used to pick one for the person's week. */
	theme: string;
};

export const AYAH_SOURCE =
	"Quran text and Saheeh International translation via quran-json (CC BY-SA 4.0).";

export const ayahs: readonly Ayah[] = [
	{
		id: "94:5",
		surah: "Ash-Sharh",
		arabic: "فَإِنَّ مَعَ ٱلۡعُسۡرِ يُسۡرًا",
		translation: "For indeed, with hardship [will be] ease",
		theme: "hardship",
	},
	{
		id: "94:6",
		surah: "Ash-Sharh",
		arabic: "إِنَّ مَعَ ٱلۡعُسۡرِ يُسۡرٗا",
		translation: "Indeed, with hardship [will be] ease",
		theme: "hardship",
	},
	{
		id: "2:152",
		surah: "Al-Baqarah",
		arabic: "فَٱذۡكُرُونِيٓ أَذۡكُرۡكُمۡ وَٱشۡكُرُواْ لِي وَلَا تَكۡفُرُونِ",
		translation: "So remember Me; I will remember you. And be grateful to Me and do not deny Me",
		theme: "remembrance",
	},
	{
		id: "2:153",
		surah: "Al-Baqarah",
		arabic: "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُواْ ٱسۡتَعِينُواْ بِٱلصَّبۡرِ وَٱلصَّلَوٰةِۚ إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ",
		translation:
			"O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient",
		theme: "patience",
	},
	{
		id: "2:186",
		surah: "Al-Baqarah",
		arabic:
			"وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌۖ أُجِيبُ دَعۡوَةَ ٱلدَّاعِ إِذَا دَعَانِۖ فَلۡيَسۡتَجِيبُواْ لِي وَلۡيُؤۡمِنُواْ بِي لَعَلَّهُمۡ يَرۡشُدُونَ",
		translation:
			"And when My servants ask you, [O Muhammad], concerning Me - indeed I am near. I respond to the invocation of the supplicant when he calls upon Me. So let them respond to Me [by obedience] and believe in Me that they may be [rightly] guided",
		theme: "dua",
	},
	{
		id: "13:28",
		surah: "Ar-Ra'd",
		arabic: "ٱلَّذِينَ ءَامَنُواْ وَتَطۡمَئِنُّ قُلُوبُهُم بِذِكۡرِ ٱللَّهِۗ أَلَا بِذِكۡرِ ٱللَّهِ تَطۡمَئِنُّ ٱلۡقُلُوبُ",
		translation:
			"Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured",
		theme: "calm",
	},
	{
		id: "65:3",
		surah: "At-Talaq",
		arabic:
			"وَيَرۡزُقۡهُ مِنۡ حَيۡثُ لَا يَحۡتَسِبُۚ وَمَن يَتَوَكَّلۡ عَلَى ٱللَّهِ فَهُوَ حَسۡبُهُۥٓۚ إِنَّ ٱللَّهَ بَٰلِغُ أَمۡرِهِۦۚ قَدۡ جَعَلَ ٱللَّهُ لِكُلِّ شَيۡءٖ قَدۡرٗا",
		translation:
			"And will provide for him from where he does not expect. And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose. Allah has already set for everything a [decreed] extent",
		theme: "trust",
	},
	{
		id: "3:139",
		surah: "Ali 'Imran",
		arabic: "وَلَا تَهِنُواْ وَلَا تَحۡزَنُواْ وَأَنتُمُ ٱلۡأَعۡلَوۡنَ إِن كُنتُم مُّؤۡمِنِينَ",
		translation:
			"So do not weaken and do not grieve, and you will be superior if you are [true] believers",
		theme: "strength",
	},
	{
		id: "39:53",
		surah: "Az-Zumar",
		arabic:
			"۞قُلۡ يَٰعِبَادِيَ ٱلَّذِينَ أَسۡرَفُواْ عَلَىٰٓ أَنفُسِهِمۡ لَا تَقۡنَطُواْ مِن رَّحۡمَةِ ٱللَّهِۚ إِنَّ ٱللَّهَ يَغۡفِرُ ٱلذُّنُوبَ جَمِيعًاۚ إِنَّهُۥ هُوَ ٱلۡغَفُورُ ٱلرَّحِيمُ",
		translation:
			'Say, "O My servants who have transgressed against themselves [by sinning], do not despair of the mercy of Allah. Indeed, Allah forgives all sins. Indeed, it is He who is the Forgiving, the Merciful',
		theme: "mercy",
	},
	{
		id: "40:60",
		surah: "Ghafir",
		arabic: "وَقَالَ رَبُّكُمُ ٱدۡعُونِيٓ أَسۡتَجِبۡ لَكُمۡۚ إِنَّ ٱلَّذِينَ يَسۡتَكۡبِرُونَ عَنۡ عِبَادَتِي سَيَدۡخُلُونَ جَهَنَّمَ دَاخِرِينَ",
		translation:
			'And your Lord says, "Call upon Me; I will respond to you." Indeed, those who disdain My worship will enter Hell [rendered] contemptible',
		theme: "dua",
	},
	{
		id: "28:24",
		surah: "Al-Qasas",
		arabic: "فَسَقَىٰ لَهُمَا ثُمَّ تَوَلَّىٰٓ إِلَى ٱلظِّلِّ فَقَالَ رَبِّ إِنِّي لِمَآ أَنزَلۡتَ إِلَيَّ مِنۡ خَيۡرٖ فَقِيرٞ",
		translation:
			'So he watered [their flocks] for them; then he went back to the shade and said, "My Lord, indeed I am, for whatever good You would send down to me, in need',
		theme: "work",
	},
	{
		id: "20:25",
		surah: "Taha",
		arabic: "قَالَ رَبِّ ٱشۡرَحۡ لِي صَدۡرِي",
		translation: '[Moses] said, "My Lord, expand for me my breast [with assurance]',
		theme: "dua",
	},
	{
		id: "20:26",
		surah: "Taha",
		arabic: "وَيَسِّرۡ لِيٓ أَمۡرِي",
		translation: "And ease for me my task",
		theme: "dua",
	},
	{
		id: "21:87",
		surah: "Al-Anbya",
		arabic:
			"وَذَا ٱلنُّونِ إِذ ذَّهَبَ مُغَٰضِبٗا فَظَنَّ أَن لَّن نَّقۡدِرَ عَلَيۡهِ فَنَادَىٰ فِي ٱلظُّلُمَٰتِ أَن لَّآ إِلَٰهَ إِلَّآ أَنتَ سُبۡحَٰنَكَ إِنِّي كُنتُ مِنَ ٱلظَّـٰلِمِينَ",
		translation:
			'And [mention] the man of the fish, when he went off in anger and thought that We would not decree [anything] upon him. And he called out within the darknesses, "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers',
		theme: "dua",
	},
	{
		id: "2:201",
		surah: "Al-Baqarah",
		arabic: "وَمِنۡهُم مَّن يَقُولُ رَبَّنَآ ءَاتِنَا فِي ٱلدُّنۡيَا حَسَنَةٗ وَفِي ٱلۡأٓخِرَةِ حَسَنَةٗ وَقِنَا عَذَابَ ٱلنَّارِ",
		translation:
			'But among them is he who says, "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire',
		theme: "dua",
	},
	{
		id: "14:7",
		surah: "Ibrahim",
		arabic: "وَإِذۡ تَأَذَّنَ رَبُّكُمۡ لَئِن شَكَرۡتُمۡ لَأَزِيدَنَّكُمۡۖ وَلَئِن كَفَرۡتُمۡ إِنَّ عَذَابِي لَشَدِيدٞ",
		translation:
			"And [remember] when your Lord proclaimed, 'If you are grateful, I will surely increase you [in favor]; but if you deny, indeed, My punishment is severe",
		theme: "gratitude",
	},
	{
		id: "93:3",
		surah: "Ad-Duhaa",
		arabic: "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ",
		translation: "Your Lord has not taken leave of you, [O Muhammad], nor has He detested [you]",
		theme: "hope",
	},
	{
		id: "93:5",
		surah: "Ad-Duhaa",
		arabic: "وَلَسَوۡفَ يُعۡطِيكَ رَبُّكَ فَتَرۡضَىٰٓ",
		translation: "And your Lord is going to give you, and you will be satisfied",
		theme: "hope",
	},
	{
		id: "50:16",
		surah: "Qaf",
		arabic: "وَلَقَدۡ خَلَقۡنَا ٱلۡإِنسَٰنَ وَنَعۡلَمُ مَا تُوَسۡوِسُ بِهِۦ نَفۡسُهُۥۖ وَنَحۡنُ أَقۡرَبُ إِلَيۡهِ مِنۡ حَبۡلِ ٱلۡوَرِيدِ",
		translation:
			"And We have already created man and know what his soul whispers to him, and We are closer to him than [his] jugular vein",
		theme: "nearness",
	},
	{
		id: "2:45",
		surah: "Al-Baqarah",
		arabic: "وَٱسۡتَعِينُواْ بِٱلصَّبۡرِ وَٱلصَّلَوٰةِۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى ٱلۡخَٰشِعِينَ",
		translation:
			"And seek help through patience and prayer, and indeed, it is difficult except for the humbly submissive [to Allah]",
		theme: "patience",
	},
	{
		id: "29:69",
		surah: "Al-'Ankabut",
		arabic: "وَٱلَّذِينَ جَٰهَدُواْ فِينَا لَنَهۡدِيَنَّهُمۡ سُبُلَنَاۚ وَإِنَّ ٱللَّهَ لَمَعَ ٱلۡمُحۡسِنِينَ",
		translation:
			"And those who strive for Us - We will surely guide them to Our ways. And indeed, Allah is with the doers of good",
		theme: "effort",
	},
	{
		id: "53:39",
		surah: "An-Najm",
		arabic: "وَأَن لَّيۡسَ لِلۡإِنسَٰنِ إِلَّا مَا سَعَىٰ",
		translation: "And that there is not for man except that [good] for which he strives",
		theme: "effort",
	},
	{
		id: "8:46",
		surah: "Al-Anfal",
		arabic: "وَأَطِيعُواْ ٱللَّهَ وَرَسُولَهُۥ وَلَا تَنَٰزَعُواْ فَتَفۡشَلُواْ وَتَذۡهَبَ رِيحُكُمۡۖ وَٱصۡبِرُوٓاْۚ إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ",
		translation:
			"And obey Allah and His Messenger, and do not dispute and [thus] lose courage and [then] your strength would depart; and be patient. Indeed, Allah is with the patient",
		theme: "patience",
	},
	{
		id: "16:97",
		surah: "An-Nahl",
		arabic:
			"مَنۡ عَمِلَ صَٰلِحٗا مِّن ذَكَرٍ أَوۡ أُنثَىٰ وَهُوَ مُؤۡمِنٞ فَلَنُحۡيِيَنَّهُۥ حَيَوٰةٗ طَيِّبَةٗۖ وَلَنَجۡزِيَنَّهُمۡ أَجۡرَهُم بِأَحۡسَنِ مَا كَانُواْ يَعۡمَلُونَ",
		translation:
			"Whoever does righteousness, whether male or female, while he is a believer - We will surely cause him to live a good life, and We will surely give them their reward [in the Hereafter] according to the best of what they used to do",
		theme: "good deeds",
	},
	{
		id: "49:13",
		surah: "Al-Hujurat",
		arabic:
			"يَـٰٓأَيُّهَا ٱلنَّاسُ إِنَّا خَلَقۡنَٰكُم مِّن ذَكَرٖ وَأُنثَىٰ وَجَعَلۡنَٰكُمۡ شُعُوبٗا وَقَبَآئِلَ لِتَعَارَفُوٓاْۚ إِنَّ أَكۡرَمَكُمۡ عِندَ ٱللَّهِ أَتۡقَىٰكُمۡۚ إِنَّ ٱللَّهَ عَلِيمٌ خَبِيرٞ",
		translation:
			"O mankind, indeed We have created you from male and female and made you peoples and tribes that you may know one another. Indeed, the most noble of you in the sight of Allah is the most righteous of you. Indeed, Allah is Knowing and Acquainted",
		theme: "people",
	},
	{
		id: "25:74",
		surah: "Al-Furqan",
		arabic: "وَٱلَّذِينَ يَقُولُونَ رَبَّنَا هَبۡ لَنَا مِنۡ أَزۡوَٰجِنَا وَذُرِّيَّـٰتِنَا قُرَّةَ أَعۡيُنٖ وَٱجۡعَلۡنَا لِلۡمُتَّقِينَ إِمَامًا",
		translation:
			'And those who say, "Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous',
		theme: "family",
	},
	{
		id: "20:114",
		surah: "Taha",
		arabic: "فَتَعَٰلَى ٱللَّهُ ٱلۡمَلِكُ ٱلۡحَقُّۗ وَلَا تَعۡجَلۡ بِٱلۡقُرۡءَانِ مِن قَبۡلِ أَن يُقۡضَىٰٓ إِلَيۡكَ وَحۡيُهُۥۖ وَقُل رَّبِّ زِدۡنِي عِلۡمٗا",
		translation:
			"So high [above all] is Allah, the Sovereign, the Truth. And, [O Muhammad], do not hasten with [recitation of] the Qur'an before its revelation is completed to you, and say, \"My Lord, increase me in knowledge",
		theme: "knowledge",
	},
	{
		id: "112:1",
		surah: "Al-Ikhlas",
		arabic: "قُلۡ هُوَ ٱللَّهُ أَحَدٌ",
		translation: 'Say, "He is Allah, [who is] One',
		theme: "oneness",
	},
	{
		id: "103:1",
		surah: "Al-'Asr",
		arabic: "وَٱلۡعَصۡرِ",
		translation: "By time",
		theme: "time",
	},
	{
		id: "103:2",
		surah: "Al-'Asr",
		arabic: "إِنَّ ٱلۡإِنسَٰنَ لَفِي خُسۡرٍ",
		translation: "Indeed, mankind is in loss",
		theme: "time",
	},
	{
		id: "103:3",
		surah: "Al-'Asr",
		arabic: "إِلَّا ٱلَّذِينَ ءَامَنُواْ وَعَمِلُواْ ٱلصَّـٰلِحَٰتِ وَتَوَاصَوۡاْ بِٱلۡحَقِّ وَتَوَاصَوۡاْ بِٱلصَّبۡرِ",
		translation:
			"Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience",
		theme: "time",
	},
	{
		id: "1:5",
		surah: "Al-Fatihah",
		arabic: "إِيَّاكَ نَعۡبُدُ وَإِيَّاكَ نَسۡتَعِينُ",
		translation: "It is You we worship and You we ask for help",
		theme: "worship",
	},
];
