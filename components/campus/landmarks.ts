export type Category = {
  id: string;
  name: string;
  color: string;
};

export const categories: Category[] = [
  { id: "all", name: "All", color: "#9FE4FF" },
  { id: "gates", name: "Gates", color: "#D85503" },
  { id: "mosques", name: "Mosques", color: "#9FE4FF" },
  { id: "sports", name: "Sports", color: "#3D66A9" },
  { id: "hostels", name: "Hostels", color: "#F4F1EA" },
  { id: "schools", name: "Schools", color: "#2A5290" },
  { id: "cafes", name: "Cafes", color: "#E58A4E" },
  { id: "banks", name: "Banks", color: "#9AA7B8" },
  { id: "facilities", name: "Facilities", color: "#7FD1B9" },
];

export const categoryColor = (id: string) =>
  categories.find((c) => c.id === id)?.color ?? "#9FE4FF";

export type Landmark = {
  id: number;
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
};

export const landmarks: Landmark[] = [
  { id: 1, name: "Gate 2", description: "Near G13 metro station; closest to boys' hostels and Fatima hostel.", lat: 33.64626618475614, lng: 72.98047567995735, category: "gates" },
  { id: 2, name: "Gate 1", description: "Near NUST metro; closest to girls' hostels. Cars only (no bikes).", lat: 33.6490449416264, lng: 72.99918820557272, category: "gates" },
  { id: 3, name: "Gate 10", description: "Next to Gate 1; allows bikes.", lat: 33.64652630927426, lng: 73.0016451088987, category: "gates" },
  { id: 4, name: "Masjid e Rahmat", description: "Central mosque. Jummah at 1:00pm and 1:45pm.", lat: 33.64414046668363, lng: 72.98603321708234, category: "mosques" },
  { id: 5, name: "Masjid e Noor", description: "Near employee quarters. Jummah at 1:30pm.", lat: 33.635584586256215, lng: 72.99169679593305, category: "mosques" },
  { id: 6, name: "Masjid e Taqwa", description: "Near student residential area.", lat: 33.642569585414776, lng: 72.99903800187133, category: "mosques" },
  { id: 7, name: "Saddle Club", description: "Horse riding and equestrian centre.", lat: 33.63763905658688, lng: 72.99233247945764, category: "sports" },
  { id: 8, name: "Skating Rink", description: "Indoor skating facility.", lat: 33.64063134961751, lng: 72.99558331674345, category: "sports" },
  { id: 9, name: "Tennis Court", description: "Professional tennis courts.", lat: 33.64237308424087, lng: 72.99651672544557, category: "sports" },
  { id: 10, name: "New Gym & Swimming Pool", description: "Modern fitness centre with pool.", lat: 33.64136377566644, lng: 72.99444606019705, category: "sports" },
  { id: 11, name: "Old Gym", description: "Next to girls' hostel; free of cost.", lat: 33.64508833356493, lng: 72.99315859984179, category: "sports" },
  { id: 12, name: "NUST Trail", description: "Walking and jogging trail.", lat: 33.64804464256944, lng: 72.99687077696603, category: "sports" },
  { id: 13, name: "Raazi Basketball Court", description: "Basketball court near Raazi hostel.", lat: 33.63932188992712, lng: 72.98655943994777, category: "sports" },
  { id: 14, name: "Cricket Nets & Ground", description: "Cricket practice facilities.", lat: 33.63675639558436, lng: 72.99098489169661, category: "sports" },
  { id: 15, name: "Cricket Ground", description: "Main cricket ground.", lat: 33.64369762454548, lng: 72.98278046378766, category: "sports" },
  { id: 16, name: "HBL Futsal Ground", description: "Futsal ground.", lat: 33.644550601922134, lng: 72.98363877062643, category: "sports" },
  { id: 17, name: "Basketball Court", description: "Main basketball court.", lat: 33.64439429779967, lng: 72.98363340620868, category: "sports" },
  { id: 18, name: "HBL Football Ground", description: "Football ground.", lat: 33.64520261036722, lng: 72.98372460134482, category: "sports" },
  { id: 19, name: "NBS Ground", description: "Sports ground near NBS.", lat: 33.64547055760955, lng: 72.98993123294242, category: "sports" },
  { id: 20, name: "Volleyball Court", description: "Recreational volleyball court.", lat: 33.64575636707401, lng: 72.98979712249886, category: "sports" },
  { id: 22, name: "Rahmat & Raazi Hostels", description: "Twin hostels for male students.", lat: 33.640237225883595, lng: 72.98673059150498, category: "hostels" },
  { id: 23, name: "Ghazali & Beruni Hostels", description: "Twin hostels for male students.", lat: 33.640308682681955, lng: 72.98771764436955, category: "hostels" },
  { id: 24, name: "Hajveri Hostel", description: "Male student hostel.", lat: 33.639486925908166, lng: 72.98644091291992, category: "hostels" },
  { id: 25, name: "Zakriya Hostel", description: "Male student hostel.", lat: 33.63972809446643, lng: 72.98880125672652, category: "hostels" },
  { id: 27, name: "Attar Hostel", description: "Male student hostel.", lat: 33.64028188637719, lng: 72.98914457946202, category: "hostels" },
  { id: 28, name: "Fatima Hostels", description: "Female student hostels.", lat: 33.643408064281104, lng: 72.98552896183182, category: "hostels" },
  { id: 29, name: "Zainab Hostel", description: "Female student hostel.", lat: 33.64554384398197, lng: 72.99381305881039, category: "hostels" },
  { id: 30, name: "Ayesha Hostel", description: "Female student hostel.", lat: 33.6452401706448, lng: 72.9945104331169, category: "hostels" },
  { id: 31, name: "Khadija Hostel", description: "Female student hostel.", lat: 33.64460602581027, lng: 72.99497177304272, category: "hostels" },
  { id: 33, name: "NICE", description: "National Institute of Civil Engineering.", lat: 33.640898199018054, lng: 72.98525001215864, category: "schools" },
  { id: 34, name: "SMME", description: "School of Mechanical & Manufacturing Engineering.", lat: 33.6368250946581, lng: 72.99019600543265, category: "schools" },
  { id: 35, name: "SADA", description: "School of Art, Design & Architecture.", lat: 33.6460618725041, lng: 72.98875977717869, category: "schools" },
  { id: 36, name: "IESE", description: "Institute of Environmental Sciences & Engineering.", lat: 33.64772311536925, lng: 72.98977901650832, category: "schools" },
  { id: 37, name: "ASAB", description: "Atta-ur-Rahman School of Applied Biosciences.", lat: 33.6465173777763, lng: 72.98784782613778, category: "schools" },
  { id: 38, name: "SCME", description: "School of Chemical & Materials Engineering.", lat: 33.64807143644584, lng: 72.99283673482383, category: "schools" },
  { id: 39, name: "SINES", description: "School of Interdisciplinary Engineering & Sciences.", lat: 33.646213707892905, lng: 72.99752523617673, category: "schools" },
  { id: 40, name: "SNS", description: "School of Natural Sciences.", lat: 33.636765328047886, lng: 72.99012122041047, category: "schools" },
  { id: 41, name: "S3H", description: "School of Social Sciences & Humanities.", lat: 33.64432284439535, lng: 72.99301577336395, category: "schools" },
  { id: 42, name: "NBS", description: "NUST Business School.", lat: 33.64388769676368, lng: 72.99103409477014, category: "schools" },
  { id: 43, name: "NSHS", description: "National Institute of Health Sciences.", lat: 33.64830284809831, lng: 72.99494528638692, category: "schools" },
  { id: 44, name: "Retro Cafe", description: "Near boys' hostel; open till 11pm. Free hostel delivery.", lat: 33.63960304418722, lng: 72.98793222105228, category: "cafes" },
  { id: 45, name: "C3 (Monal of NUST)", description: "Near the library with a beautiful view.", lat: 33.64197114861547, lng: 72.99390961836593, category: "cafes" },
  { id: 46, name: "C2", description: "Next to SEECS: mart, tailor, stationery, barber, ATM.", lat: 33.643176949884214, lng: 72.98810531815836, category: "cafes" },
  { id: 47, name: "C1", description: "Near girls' hostel; has a mart and ATM.", lat: 33.64663348656651, lng: 72.99016525463234, category: "cafes" },
  { id: 49, name: "Coffee Lounge", description: "Next to C1; best desserts on campus.", lat: 33.647839222540455, lng: 72.99069096752451, category: "cafes" },
  { id: 50, name: "Inno Cafe", description: "Next to SINES; near NSTP and NSHS.", lat: 33.64633161560935, lng: 72.99686234957275, category: "cafes" },
  { id: 51, name: "HBL Bank", description: "Full bank; open accounts and pay fees here.", lat: 33.64334928578137, lng: 72.98492623099703, category: "banks" },
  { id: 52, name: "Askari Bank", description: "Near NSTP; pay mess bills here.", lat: 33.645936287307755, lng: 72.99644154244798, category: "banks" },
  { id: 53, name: "ATM", description: "Cash withdrawals.", lat: 33.64406013671743, lng: 72.99805314104123, category: "banks" },
  { id: 55, name: "NUST Library", description: "Central academic library with study spaces.", lat: 33.64162280290894, lng: 72.99241831015483, category: "facilities" },
  { id: 56, name: "Convocation Ground", description: "Main convocation and event ground.", lat: 33.64287683158571, lng: 72.99225108743407, category: "facilities" },
  { id: 57, name: "Jinnah Auditorium", description: "Main auditorium for events and ceremonies.", lat: 33.64331606443697, lng: 72.99350709147387, category: "facilities" },
  { id: 58, name: "Helipad Ground", description: "Event ground for guests.", lat: 33.64458186274385, lng: 72.98955572370046, category: "facilities" },
  { id: 59, name: "NUST Medical Centre", description: "Treatment and free medicines for emergencies.", lat: 33.64417302483192, lng: 72.9977396698001, category: "facilities" },
  { id: 60, name: "Admin Block", description: "Hostel office and administration.", lat: 33.64456093431306, lng: 72.98486419964361, category: "facilities" },
  { id: 61, name: "NUST Gate 4", description: "Near NICE and the Exam Centre.", lat: 33.6410653, lng: 72.9836721, category: "gates" },
  { id: 62, name: "NUST Gate 15", description: "Side gate near NICE lawn.", lat: 33.6420923, lng: 72.9857111, category: "gates" },
  { id: 63, name: "NUST Gate 16", description: "Side gate near C2 and SEECS.", lat: 33.6429645, lng: 72.9888616, category: "gates" },
  { id: 64, name: "SEECS", description: "School of Electrical Engineering & Computer Science; UG, PG and faculty blocks.", lat: 33.6425, lng: 72.9904, category: "schools" },
  { id: 65, name: "IGIS", description: "Institute of Geographical Information Systems, under SCEE.", lat: 33.6449853, lng: 72.9882661, category: "schools" },
  { id: 66, name: "RIMMS", description: "Research Institute for Microwave & Millimeter Wave Studies.", lat: 33.64436, lng: 72.9870543, category: "schools" },
  { id: 67, name: "USPCAS-E", description: "US-Pakistan Center for Advanced Studies in Energy.", lat: 33.6422533, lng: 72.9844129, category: "schools" },
  { id: 68, name: "CIPS", description: "Centre for International Peace & Stability.", lat: 33.6454114, lng: 72.9872866, category: "schools" },
  { id: 69, name: "NUST Creative Learning School", description: "K-12 school for children of NUST staff and faculty.", lat: 33.6450191, lng: 73.0020588, category: "schools" },
  { id: 70, name: "NUST Main Office", description: "Rectorate; university administration building.", lat: 33.6425521, lng: 72.9930743, category: "facilities" },
  { id: 71, name: "Rumi Hostel", description: "Postgraduate hostel, blocks I and II.", lat: 33.6456, lng: 72.992, category: "hostels" },
  { id: 72, name: "Amna Hostel", description: "Female student hostel.", lat: 33.6440018, lng: 72.9952173, category: "hostels" },
  { id: 73, name: "Rayyan Hostel", description: "Male student hostel.", lat: 33.6409644, lng: 72.980579, category: "hostels" },
  { id: 74, name: "Galaxy Hostel", description: "Male student hostel.", lat: 33.6418877, lng: 72.9795678, category: "hostels" },
  { id: 75, name: "Liaquat Hostel", description: "Male student hostel.", lat: 33.6395365, lng: 72.9888295, category: "hostels" },
  { id: 76, name: "Capital Hostel", description: "Female student hostel.", lat: 33.6416223, lng: 72.9805774, category: "hostels" },
  { id: 77, name: "Squash Court", description: "Indoor squash facility near Sir Syed Mess.", lat: 33.6409508, lng: 72.9871002, category: "sports" },
  { id: 78, name: "Badminton Court", description: "Near the new gym and swimming pool.", lat: 33.6414708, lng: 72.9945159, category: "sports" },
  { id: 79, name: "NSTP Cafe", description: "Cafe inside the National Science & Technology Park.", lat: 33.646463, lng: 72.9969304, category: "cafes" },
  { id: 80, name: "Maryam Mess", description: "Dining mess near the girls' hostels.", lat: 33.6438765, lng: 72.9946982, category: "cafes" },
  { id: 81, name: "Shawarma Ladz", description: "Fast food near C1 and Coffee Lounge.", lat: 33.6477642, lng: 72.9906688, category: "cafes" },
  { id: 82, name: "Jango", description: "Cafe near the boys' hostel area.", lat: 33.6393961, lng: 72.9880189, category: "cafes" },
];
