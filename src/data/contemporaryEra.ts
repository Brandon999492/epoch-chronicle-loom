import type { HistoricalEra } from "./types";

export const contemporaryEras: HistoricalEra[] = [
  {
    id: "contemporary",
    name: "Contemporary Era",
    period: "1945 – Present",
    startYear: 1945,
    endYear: 2026,
    description:
      "The Cold War, decolonization, nuclear deterrence, globalization, digital networks, and accelerating scientific change define the contemporary world.",
    color: "170 45% 40%",
    events: [
      {
        id: "ct1",
        title: "United Nations Founded",
        year: 1945,
        yearLabel: "1945 CE",
        description:
          "The United Nations was created in the aftermath of World War II, when political leaders, legal scholars, and civil society organizations sought to prevent another global catastrophe. Delegates from fifty-one countries met in San Francisco and signed the UN Charter, creating institutions meant to reduce unilateral war-making and to promote negotiation, mediation, and collective security. The structure reflected both idealism and power politics: a universal General Assembly, but also a Security Council where the major victors of the war held veto power.\n\nFrom the beginning, the UN was more than a diplomatic forum. Its specialized agencies and affiliated bodies addressed food security, refugee protection, labor rights, health, education, and postwar reconstruction. Programs connected to UNICEF, UNESCO, WHO, and UNHCR created mechanisms for ongoing international coordination, and the organization gradually became central to treaty making in areas such as decolonization, disarmament, and development.\n\nThe UN has always been criticized for inconsistency, bureaucratic inertia, and selective enforcement, especially when great-power interests are at stake. Yet its long-term significance is substantial: it normalized multilateral diplomacy, created durable legal and humanitarian frameworks, and offered smaller states institutional visibility they had never previously possessed in global politics.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/UN_General_Assembly_hall.jpg/520px-UN_General_Assembly_hall.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/United_Nations" }],
      },
      {
        id: "ct2",
        title: "Nuremberg Trials",
        year: 1945,
        yearLabel: "1945 CE",
        description:
          "The International Military Tribunal at Nuremberg prosecuted leading figures of the Nazi regime for crimes against peace, war crimes, and crimes against humanity. The proceedings unfolded in a devastated Europe where evidence of systematic mass murder, forced labor, and aggressive warfare had become impossible to deny. Prosecutors assembled documentary records, film footage, and witness testimony to demonstrate the bureaucratic and political architecture of Nazi violence.\n\nA central innovation of Nuremberg was the legal principle that individuals could be held personally accountable under international law, even when acting under state authority. The tribunal rejected blanket defenses based on superior orders and established that state office did not grant immunity from prosecution for atrocity crimes. This was a foundational break from older assumptions that only states, not persons, were subjects of international legal responsibility.\n\nThe trials have been debated for decades, including criticisms that victor powers were not similarly prosecuted for their own wartime actions. Even so, Nuremberg remains a decisive legal milestone: it influenced later ad hoc tribunals, informed the Genocide Convention, and contributed to the eventual creation of permanent international criminal institutions.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Nuremberg_Trials_retouched.jpg/520px-Nuremberg_Trials_retouched.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Nuremberg_trials" }],
      },
      {
        id: "ct3",
        title: "Partition of India",
        year: 1947,
        yearLabel: "1947 CE",
        description:
          "The partition of British India into India and Pakistan accompanied decolonization but unfolded through hurried boundary-making, weak administrative preparation, and escalating communal fears. As imperial governance receded, political negotiations among British officials, the Indian National Congress, and the Muslim League failed to produce a unified constitutional settlement acceptable to all major constituencies. The decision to partition transformed a constitutional dispute into a mass human emergency.\n\nThe result was one of the largest forced population movements in modern history. Millions of people crossed new borders in Punjab and Bengal amid raids, abductions, sexual violence, and retaliatory killings. Casualty estimates vary widely in scholarship, but most analyses place deaths in the hundreds of thousands to roughly one to two million, with uncertainty due to incomplete records. The trauma was local and intimate: families split, property abandoned, and memory scarred across generations.\n\nPartition’s consequences remain geopolitically central. India and Pakistan entered recurrent conflict, including wars over Kashmir, and later developed nuclear arsenals within a hostile regional security environment. Socially and culturally, partition reshaped citizenship, minority politics, and historical memory across South Asia, with enduring effects on identity and state formation.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Partition_of_India.PNG/440px-Partition_of_India.PNG",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Partition_of_India" }],
      },
      {
        id: "ct4",
        title: "State of Israel Proclaimed",
        year: 1948,
        yearLabel: "1948 CE",
        description:
          "The declaration of the State of Israel in 1948 emerged from overlapping historical forces: Zionist nationalism, British imperial administration in Mandatory Palestine, Arab anti-colonial politics, and the moral shock of the Holocaust. Competing national claims over the same territory had intensified through the interwar period, and UN partition proposals did not resolve core disputes over sovereignty, demography, and rights.\n\nIndependence was followed almost immediately by regional war involving neighboring Arab states and local Palestinian and Jewish forces. The conflict produced large-scale displacement of Palestinians, a foundational event in Palestinian historical memory often referred to as the Nakba. Israeli state formation, military consolidation, and immigration policy proceeded in tandem with unresolved refugee status and contested territorial control.\n\nThis moment established one of the most persistent conflicts in modern international relations. Subsequent wars, occupations, peace processes, settlement expansion, and periodic escalations have unfolded on the structural foundations created in 1948. Scholars and policymakers continue to debate legal, moral, and political pathways to security, sovereignty, and justice for all affected populations.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Declaration_of_State_of_Israel_1948.jpg/440px-Declaration_of_State_of_Israel_1948.jpg",
        sourceLinks: [
          {
            label: "Wikipedia",
            url: "https://en.wikipedia.org/wiki/Israeli_Declaration_of_Independence",
          },
        ],
      },
      {
        id: "ct5",
        title: "Universal Declaration of Human Rights",
        year: 1948,
        yearLabel: "1948 CE",
        description:
          "Adopted by the UN General Assembly in 1948, the Universal Declaration of Human Rights articulated a broad ethical and legal vocabulary for postwar international order. Drafted through intense negotiations among delegates from different legal systems and cultural traditions, it attempted to define a minimal shared standard of dignity after unprecedented wartime atrocities.\n\nAlthough not initially binding as a treaty, the declaration became normatively powerful. It influenced constitutions, courts, and social movements while shaping later legal instruments such as the International Covenants on Civil and Political Rights and on Economic, Social and Cultural Rights. Its language linked political freedoms to social protections, framing rights as interdependent rather than narrowly procedural.\n\nImplementation has remained uneven and deeply political. States routinely invoke rights discourse while violating it domestically or abroad. Yet the declaration’s long-term significance is clear: it provided activists, lawyers, and communities with a widely recognized framework for accountability, and it transformed how legitimacy is contested in global politics.",
        category: "treaty",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Eleanor_Roosevelt_UDHR.jpg/440px-Eleanor_Roosevelt_UDHR.jpg",
        sourceLinks: [
          {
            label: "Wikipedia",
            url: "https://en.wikipedia.org/wiki/Universal_Declaration_of_Human_Rights",
          },
        ],
      },
      {
        id: "ct6",
        title: "NATO Established",
        year: 1949,
        yearLabel: "1949 CE",
        description:
          "The North Atlantic Treaty Organization was established in 1949 as a collective defense alliance amid escalating tensions between Western states and the Soviet Union. The alliance institutionalized military coordination, intelligence sharing, and strategic planning among member states that feared coercion or invasion in a rapidly polarizing international system.\n\nArticle 5, the mutual defense clause, became NATO’s defining political signal. Its deterrent effect rested less on automatic military mechanics and more on credible commitment among members, especially under the U.S. nuclear umbrella. Over time, NATO also became a platform for interoperability, standardization, and joint command structures that reshaped transatlantic military doctrine.\n\nAfter the Cold War, NATO expanded geographically and broadened operational scope, including interventions beyond the original treaty area. This evolution remains contested: supporters view it as adaptive security governance; critics argue expansion intensified confrontation with Russia. Regardless of interpretation, NATO has been a central institution in European and global security architecture since 1949.",
        category: "treaty",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Flag_of_NATO.svg/440px-Flag_of_NATO.svg.png",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/NATO" }],
      },
      {
        id: "ct7",
        title: "Chinese Communist Revolution",
        year: 1949,
        yearLabel: "1949 CE",
        description:
          "The victory of the Chinese Communist Party in 1949 concluded a prolonged struggle shaped by civil war, anti-imperial nationalism, Japanese invasion, and social crisis in rural China. The proclamation of the People’s Republic of China marked a profound transfer of political authority and reordered East Asian geopolitics at the opening of the Cold War.\n\nRevolutionary governance pursued land reform, state consolidation, and mass mobilization campaigns, while the defeated Nationalist government retreated to Taiwan. The new regime framed legitimacy through anti-feudal transformation and national sovereignty, but policy experimentation also generated severe upheavals in later decades, including famine and political violence under campaigns such as the Great Leap Forward and Cultural Revolution.\n\nIn long-term perspective, 1949 established the institutional basis for one of the most consequential state trajectories in modern history: a socialist revolutionary state that later combined one-party rule with market-oriented economic reforms. The revolution remains central to debates over development, authoritarian governance, and global power transition.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Mao_Zedong_in_1927.jpg/300px-Mao_Zedong_in_1927.jpg",
        sourceLinks: [
          { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Chinese_Communist_Revolution" },
        ],
      },
      {
        id: "ct8",
        title: "Korean War",
        year: 1950,
        yearLabel: "1950 CE",
        description:
          "The Korean War began when North Korean forces crossed the 38th parallel in 1950, transforming a divided post-colonial peninsula into a major battleground of Cold War confrontation. United Nations forces led by the United States intervened on behalf of South Korea, while Chinese forces entered when front lines approached the Yalu River. The conflict quickly escalated from rapid offensives to attritional warfare.\n\nCivilian suffering was immense. Bombardment, massacres, forced displacement, and infrastructure destruction affected populations across both Koreas. Death estimates vary by method and source, but scholars generally agree that casualties reached into the millions, with a very large civilian share. The armistice in 1953 halted major fighting without a formal peace treaty, leaving legal war status unresolved.\n\nThe war’s legacies remain active in contemporary geopolitics: a militarized border, competing Korean state narratives, recurring nuclear crises, and persistent alliance structures in Northeast Asia. It also set an early precedent for limited war under nuclear shadow, where superpowers pursued strategic goals while attempting to avoid direct total war.",
        category: "war",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Korean_War_Montage_2.png/440px-Korean_War_Montage_2.png",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Korean_War" }],
      },
      {
        id: "ct9",
        title: "Discovery of DNA's Double Helix",
        year: 1953,
        yearLabel: "1953 CE",
        description:
          "The 1953 model of DNA as a double helix provided a mechanistic explanation for heredity and replication, reshaping biological science. James Watson and Francis Crick’s proposal drew critically on X-ray diffraction evidence generated by Rosalind Franklin and Maurice Wilkins, along with biochemical constraints on base pairing. The model connected structure to function in a way earlier genetic theories could not.\n\nIts scientific impact was immediate and cumulative. Molecular biology emerged as a central research paradigm, linking genetics, biochemistry, and later computational analysis. Over subsequent decades, techniques in sequencing, recombinant DNA, and gene expression analysis transformed medicine, agriculture, forensics, and evolutionary studies. The discovery became foundational for twentieth-century life science.\n\nHistoriographically, the event also prompted sustained ethical and credit debates, especially regarding Franklin’s role and gendered scientific recognition. As scholarship expanded, the story moved beyond heroic simplification toward a more collaborative and contested account of discovery, illustrating how scientific progress is produced through institutions, competition, and unequal access to authority.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/DNA_Structure%2BKey%2BLabelled.pn_NoBB.png/300px-DNA_Structure%2BKey%2BLabelled.pn_NoBB.png",
        sourceLinks: [
          {
            label: "Wikipedia",
            url: "https://en.wikipedia.org/wiki/Molecular_structure_of_nucleic_acids",
          },
        ],
      },
      {
        id: "ct10",
        title: "Brown v. Board of Education",
        year: 1954,
        yearLabel: "1954 CE",
        description:
          "In Brown v. Board of Education, the U.S. Supreme Court unanimously ruled that segregated public schools were inherently unequal, overturning legal doctrine that had legitimized racial separation for decades. The decision reflected sustained litigation strategy by civil rights lawyers, especially the NAACP Legal Defense Fund, who demonstrated both legal inconsistency and measurable educational harm under segregation.\n\nBrown was jurisprudentially transformative but institutionally resisted. Southern officials launched campaigns of 'massive resistance,' local authorities delayed compliance, and desegregation often required federal enforcement. The case therefore illustrated a core constitutional reality: court decisions can establish legal principles, but social transformation depends on implementation, political struggle, and movement pressure.\n\nIts long-term significance extends beyond education. Brown energized civil rights activism, shaped equal protection doctrine, and provided legal language for later rights claims. At the same time, continuing school inequality through district funding disparities and residential segregation shows the limits of formal legal victories when structural inequalities remain intact.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Nettie_Hunt_and_daughter_on_steps_of_Supreme_Court.jpg/300px-Nettie_Hunt_and_daughter_on_steps_of_Supreme_Court.jpg",
        sourceLinks: [
          { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Brown_v._Board_of_Education" },
        ],
      },
      {
        id: "ct11",
        title: "Rosa Parks and the Montgomery Bus Boycott",
        year: 1955,
        yearLabel: "1955 CE",
        description:
          "Rosa Parks’ refusal to surrender her bus seat in Montgomery became a catalytic moment in the U.S. civil rights movement, but the event was rooted in longstanding local organizing by Black women, churches, labor advocates, and community networks. The boycott that followed lasted more than a year and required sophisticated logistical coordination, including carpools, fundraising, legal strategy, and disciplined nonviolent protest.\n\nThe campaign elevated Martin Luther King Jr. to national prominence while demonstrating that sustained collective action could impose economic pressure on segregated systems. It also exposed the vulnerability of local segregation regimes when municipal institutions depended on Black labor yet denied Black citizenship rights. Legal victory came through federal court rulings, but social legitimacy was won in the streets and congregations.\n\nMontgomery’s significance lies in movement infrastructure as much as symbolism. It helped consolidate strategies later used across the South, linking moral language, media visibility, constitutional claims, and grassroots resilience. The boycott is therefore best understood as a strategic turning point rather than a spontaneous singular act.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Rosaparks.jpg/300px-Rosaparks.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Rosa_Parks" }],
      },
      {
        id: "ct12",
        title: "Sputnik Launches the Space Race",
        year: 1957,
        yearLabel: "1957 CE",
        description:
          "The launch of Sputnik 1 by the Soviet Union in 1957 demonstrated operational orbital capability and instantly altered strategic perceptions in the Cold War. A small satellite transmitting simple radio signals carried outsized political meaning: if rockets could place payloads in orbit, they could also deliver long-range weapons. The event triggered public anxiety in the United States and accelerated state investment in science and engineering.\n\nInstitutionally, Sputnik helped catalyze the creation of NASA, expanded federal support for research universities, and intensified curriculum reform in mathematics and physics. The resulting competition produced both military and civilian technological spillovers, from satellite communications and Earth observation to advances in materials science and computing. The 'space race' became a proxy arena for ideological legitimacy.\n\nIn historical perspective, Sputnik marks the beginning of space as a permanent domain of human activity and geopolitical rivalry. It also illustrates how symbolic technological firsts can reshape policy priorities, labor markets, and educational systems far beyond their immediate technical scope.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Sputnik_asm.jpg/440px-Sputnik_asm.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Sputnik_1" }],
      },
      {
        id: "ct13",
        title: "Cuban Revolution",
        year: 1959,
        yearLabel: "1959 CE",
        description:
          "The Cuban Revolution replaced the Batista dictatorship with a new regime led by Fidel Castro after years of insurgency, urban resistance, and political repression. Revolutionary legitimacy was built on anti-corruption rhetoric, social inequality critiques, and opposition to foreign influence in Cuba’s economy and politics. Initial broad support fragmented as the new state centralized authority and aligned with socialist governance.\n\nThe revolution quickly became a central Cold War flashpoint. U.S.-Cuban relations deteriorated through nationalizations, embargo policy, covert operations, and the failed Bay of Pigs invasion. Soviet-Cuban strategic alignment culminated in the 1962 missile crisis, demonstrating how local revolutionary change could trigger global nuclear confrontation.\n\nCuba’s long-term trajectory is complex: notable achievements in literacy and public health coexist with political repression, restricted pluralism, and economic vulnerability under sanctions and structural constraints. The revolution remains a major case study in decolonial nationalism, state socialism, and geopolitical asymmetry in the Western Hemisphere.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Fidel_Castro_-_MATS_Terminal_Washington_1959.JPG/300px-Fidel_Castro_-_MATS_Terminal_Washington_1959.JPG",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Cuban_Revolution" }],
      },
      {
        id: "ct14",
        title: "Yuri Gagarin: First Human in Space",
        year: 1961,
        yearLabel: "1961 CE",
        description:
          "Yuri Gagarin’s orbital flight aboard Vostok 1 in 1961 was a technical and symbolic breakthrough that confirmed human survival and mission control in spaceflight conditions. The mission lasted just over an hour, but its strategic implications were global. Soviet propaganda presented the achievement as proof of socialist scientific superiority, while rival states interpreted it through military and ideological competition.\n\nEngineering challenges were substantial: life-support reliability, reentry stabilization, communications, and recovery procedures all required rapid advancement under secrecy and time pressure. Gagarin became an international celebrity, and his image was mobilized to represent modernity, discipline, and technological destiny. The mission elevated spaceflight from speculative frontier to state-backed operational program.\n\nHistorically, Gagarin’s flight accelerated crewed space programs on both sides of the Cold War divide and contributed directly to political commitments such as the U.S. lunar objective. It also opened enduring questions about risk ethics, astronaut labor, and the relationship between scientific exploration and geopolitical competition.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Yuri_Gagarin_%281961%29_-_Restoration.jpg/300px-Yuri_Gagarin_%281961%29_-_Restoration.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Yuri_Gagarin" }],
      },
      {
        id: "ct15",
        title: "Construction of the Berlin Wall",
        year: 1961,
        yearLabel: "1961 CE",
        description:
          "The Berlin Wall was erected in 1961 to halt the large-scale emigration of East Germans through Berlin, where the city’s divided occupation system created a unique escape corridor. For East German and Soviet authorities, the outflow represented both economic loss and political delegitimation. For Western observers, the wall quickly became the most visible symbol of coercive division in Cold War Europe.\n\nPhysically, the barrier evolved from barbed wire to a layered border regime with concrete walls, patrol roads, watchtowers, and armed enforcement. Families were separated, neighborhoods were severed, and movement became heavily criminalized. Attempts to cross carried lethal risk, and deaths along the inner-German border and Berlin frontier remain a deeply documented part of European memory politics.\n\nThe wall’s historical significance exceeds architecture. It condensed ideological conflict into urban space, dramatizing the relationship between sovereignty and mobility. Its later fall in 1989 would therefore be interpreted not only as a policy reversal but as the collapse of an entire political order in Central and Eastern Europe.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Berlinermauer.jpg/440px-Berlinermauer.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Berlin_Wall" }],
      },
      {
        id: "ct16",
        title: "Cuban Missile Crisis",
        year: 1962,
        yearLabel: "1962 CE",
        description:
          "The Cuban Missile Crisis of October 1962 brought the United States and Soviet Union to the brink of nuclear war after U.S. reconnaissance identified Soviet missile deployments in Cuba. Decision-making occurred under severe uncertainty, compressed timelines, and escalating public pressure. Both governments sought to preserve deterrence credibility while avoiding uncontrollable military escalation.\n\nThe crisis included naval quarantine, secret diplomacy, military mobilization, and intense internal debate among political and military elites. Subsequent archival evidence shows that risk was higher than many contemporaries understood, including local command ambiguities and battlefield nuclear capabilities. Resolution came through reciprocal concessions: Soviet withdrawal from Cuba, U.S. non-invasion assurances, and later removal of U.S. missiles from Turkey.\n\nLong-term effects were institutional as well as psychological. The episode encouraged crisis-management mechanisms such as the Washington-Moscow hotline and contributed to arms-control initiatives. It remains a core case in strategic studies on signaling, misperception, command-and-control vulnerability, and the dangers of brinkmanship under nuclear conditions.",
        category: "war",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/P-2_missile_on_a_launcher_%28cropped%29.jpg/440px-P-2_missile_on_a_launcher_%28cropped%29.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Cuban_Missile_Crisis" }],
      },
      {
        id: "ct17",
        title: "Martin Luther King Jr.'s 'I Have a Dream'",
        year: 1963,
        yearLabel: "1963 CE",
        description:
          "Delivered during the March on Washington in 1963, Martin Luther King Jr.’s 'I Have a Dream' speech synthesized constitutional argument, prophetic religious language, and movement strategy. The speech did not stand apart from organizing; it emerged from coordinated campaigns against segregation, voter suppression, labor exclusion, and police violence. Its rhetorical power depended on that social foundation.\n\nKing reframed civil rights as unfinished democratic obligation, invoking founding documents while exposing their unequal application. The address linked immediate policy demands to a broader moral horizon, making it both politically legible and emotionally resonant across diverse audiences. Media circulation amplified its reach, helping convert local and regional struggles into national urgency.\n\nHistorically, the speech became canonical in public memory, sometimes at the cost of flattening King’s wider radical critique of economic inequality and militarism. Scholarly interpretation now emphasizes both its inspirational function and its place within a broader movement ecosystem that made legislative gains possible.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/March_on_washington_Aug_28_1963.jpg/440px-March_on_washington_Aug_28_1963.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/I_Have_a_Dream" }],
      },
      {
        id: "ct18",
        title: "Assassination of President Kennedy",
        year: 1963,
        yearLabel: "1963 CE",
        description:
          "President John F. Kennedy was assassinated in Dallas in November 1963 during a public motorcade, producing immediate national shock and long-term political trauma. Within hours, constitutional succession placed Lyndon B. Johnson in office, preserving formal continuity while public trust entered a prolonged period of instability. The event became one of the most scrutinized episodes in modern U.S. history.\n\nOfficial investigations, especially the Warren Commission, concluded that Lee Harvey Oswald acted alone, but evidentiary disputes and communication failures fueled persistent conspiracy narratives. The rapid killing of Oswald by Jack Ruby further deepened public suspicion, and subsequent archival releases have not fully resolved popular doubt. The assassination thus became an enduring example of how uncertainty and state secrecy interact in mass political culture.\n\nHistorically, Kennedy’s death altered policy trajectories and symbolic politics. Johnson’s administration advanced major domestic legislation, including civil rights reforms, while U.S. foreign policy moved deeper into Vietnam. In memory politics, the assassination marked a rupture point in narratives of postwar American confidence.",
        category: "assassination",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/John_F._Kennedy%2C_White_House_color_photo_portrait.jpg/300px-John_F._Kennedy%2C_White_House_color_photo_portrait.jpg",
        sourceLinks: [
          { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Assassination_of_John_F._Kennedy" },
        ],
      },
      {
        id: "ct19",
        title: "Civil Rights Act of 1964",
        year: 1964,
        yearLabel: "1964 CE",
        description:
          "The Civil Rights Act of 1964 represented a major legislative defeat for formal segregation in the United States. Passed after years of organizing, litigation, and violent backlash against civil rights activism, the law prohibited discrimination in public accommodations, employment, and federally assisted programs. It also strengthened federal enforcement authority in ways earlier statutes had not.\n\nIts passage required complex coalition-building in Congress and sustained executive pressure, including strategic use of public opinion during moments of national crisis. Grassroots activism in Birmingham, Freedom Summer, and other campaigns shaped legislative momentum by making the costs of inaction visible. The act therefore emerged from movement-state interaction, not elite benevolence alone.\n\nThe law transformed legal infrastructure but did not eliminate structural racial inequality. Housing segregation, wealth disparities, school funding inequities, and discriminatory policing persisted. Still, the act remains a core institutional milestone that altered legal opportunity structures and enabled subsequent rights enforcement across race, gender, religion, and national origin.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Lyndon_Johnson_signing_Civil_Rights_Act%2C_July_2%2C_1964.jpg/440px-Lyndon_Johnson_signing_Civil_Rights_Act%2C_July_2%2C_1964.jpg",
        sourceLinks: [
          { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Civil_Rights_Act_of_1964" },
        ],
      },
      {
        id: "ct20",
        title: "Vietnam War Escalates",
        year: 1965,
        yearLabel: "1965 CE",
        description:
          "Large-scale U.S. troop deployment to Vietnam in 1965 marked a major escalation in a conflict already rooted in decolonization, Cold War containment doctrine, and competing Vietnamese state projects. Policymakers framed intervention as necessary to prevent regional communist expansion, yet strategic assumptions often underestimated local political dynamics and overestimated coercive military effectiveness.\n\nThe war became protracted and destructive, involving extensive aerial bombardment, counterinsurgency campaigns, and heavy civilian harm. Casualty accounting remains methodologically contested, but millions of Vietnamese civilians and combatants died, alongside tens of thousands of U.S. personnel. Chemical defoliants, forced displacement, and long-term unexploded ordnance created enduring environmental and health consequences.\n\nDomestically, the conflict intensified political polarization in the United States, energized antiwar activism, and contributed to broader crises of institutional trust. Internationally, it exposed limits of superpower military intervention in nationalist conflicts. Vietnam remains central to strategic debate on escalation, legitimacy, and the gap between tactical success and political outcomes.",
        category: "war",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/VietnamMural.jpg/440px-VietnamMural.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Vietnam_War" }],
      },
      {
        id: "ct21",
        title: "Assassination of Martin Luther King Jr.",
        year: 1968,
        yearLabel: "1968 CE",
        description:
          "Martin Luther King Jr. was assassinated in Memphis in April 1968 while supporting striking sanitation workers, a fact that underscores his late-career focus on economic justice as well as civil rights. His death triggered grief, protest, and unrest across numerous U.S. cities, reflecting both personal loss and accumulated anger over structural inequality.\n\nKing’s assassination occurred during a period of broad political turbulence that included antiwar mobilization, urban rebellion, and generational conflict. Movement organizations responded in divergent ways: some reaffirmed nonviolent strategy, while others emphasized self-defense and more militant political frameworks. State surveillance and repression of Black activists further shaped this transitional moment.\n\nThe long-term legacy is dual: King became an official national symbol, yet many radical dimensions of his politics were selectively remembered. Contemporary scholarship emphasizes that his critique linked race, class, and militarism, and that his assassination represented not an endpoint but a reconfiguration of freedom struggles in the late twentieth century.",
        category: "assassination",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Martin_Luther_King%2C_Jr..jpg/300px-Martin_Luther_King%2C_Jr..jpg",
        sourceLinks: [
          {
            label: "Wikipedia",
            url: "https://en.wikipedia.org/wiki/Assassination_of_Martin_Luther_King_Jr.",
          },
        ],
      },
      {
        id: "ct22",
        title: "Moon Landing (Apollo 11)",
        year: 1969,
        yearLabel: "1969 CE",
        description:
          "Apollo 11’s lunar landing in 1969 was the culmination of intensive state investment in aerospace engineering, systems integration, and mission planning under Cold War competition. Neil Armstrong and Buzz Aldrin’s surface operations, with Michael Collins in lunar orbit, demonstrated the feasibility of complex human missions beyond Earth orbit and validated a broad technological ecosystem extending far beyond the spacecraft itself.\n\nThe mission carried layered meanings: scientific curiosity, national prestige, military-adjacent technological capability, and global media spectacle. Live broadcast to vast international audiences transformed the landing into a shared symbolic moment, even among populations critical of U.S. foreign policy. Lunar samples, imaging, and instrumentation produced enduring scientific returns for planetary geology.\n\nApollo 11 also intensified debates about public spending, inequality, and priority-setting, especially during ongoing war and domestic unrest. Historically, it remains a rare example of high-risk, high-complexity public research achieving a politically defined objective on deadline, while also reshaping global imagination about technology and collective ambition.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Aldrin_Apollo_11.jpg/300px-Aldrin_Apollo_11.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Apollo_11" }],
      },
      {
        id: "ct23",
        title: "ARPANET: Birth of the Internet",
        year: 1969,
        yearLabel: "1969 CE",
        description:
          "ARPANET’s first host-to-host transmission in 1969 marked a foundational step in the development of packet-switched networking. Designed through U.S. government-funded research, the project aimed to connect distributed computing resources across institutions, enabling more resilient communication architectures than centralized systems. Early technical experimentation solved problems of routing, protocols, and interoperability that would shape later network design.\n\nOver time, protocol standardization—especially the adoption of TCP/IP—allowed expansion beyond military and academic environments. What began as a specialist infrastructure gradually evolved into the internet, and then into the web-enabled social and economic system that now underpins commerce, communication, governance, and culture. The trajectory illustrates how public research can generate long-term general-purpose technologies.\n\nThe internet’s growth has produced transformative opportunities and systemic risks: knowledge access, collaborative science, and new markets on one side; surveillance, disinformation, cyber conflict, and platform concentration on the other. ARPANET’s historical significance lies in opening a technological pathway whose social consequences continue to unfold.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Arpanet_logical_map%2C_march_1977.png/440px-Arpanet_logical_map%2C_march_1977.png",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/ARPANET" }],
      },
      {
        id: "ct24",
        title: "Watergate Scandal",
        year: 1972,
        yearLabel: "1972 CE",
        description:
          "Watergate began with a break-in at Democratic Party offices in 1972 but expanded into a constitutional crisis involving covert operations, campaign abuses, and executive obstruction. Investigative journalism, judicial rulings, and congressional hearings gradually exposed a pattern of political misconduct tied to the Nixon administration. The scandal’s significance lay less in the burglary itself than in institutional attempts to conceal responsibility.\n\nA key turning point came with tape evidence demonstrating presidential involvement in the cover-up. As impeachment became likely, Nixon resigned in 1974, making him the first U.S. president to leave office under that pressure. The episode tested separation of powers and demonstrated that formal accountability mechanisms could still operate under intense partisan conflict.\n\nWatergate reshaped public trust and regulatory politics. It contributed to campaign finance reforms, strengthened norms of press scrutiny, and deepened skepticism toward executive secrecy. The scandal remains a benchmark in democratic theory for evaluating corruption, constitutional safeguards, and the fragility of institutional legitimacy.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Nixon_30-0316a.jpg/300px-Nixon_30-0316a.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Watergate_scandal" }],
      },
      {
        id: "ct25",
        title: "End of the Vietnam War",
        year: 1975,
        yearLabel: "1975 CE",
        description:
          "The fall of Saigon in April 1975 marked the military and political collapse of South Vietnam and the effective end of prolonged U.S. wartime involvement. Evacuation scenes from the U.S. embassy became iconic representations of strategic failure and policy overreach. For Vietnam, the conflict’s end opened a new phase of national unification under communist leadership, but after extraordinary social and material devastation.\n\nPostwar transitions involved reeducation programs, refugee movements, and major economic restructuring. Large numbers of Vietnamese left by sea and land in subsequent years, creating diasporic communities whose memories of war and state transition remain diverse and often contested. International normalization took decades and unfolded through changing regional and global alignments.\n\nHistorically, 1975 became a reference point in U.S. and comparative military analysis for the limits of intervention in civil conflicts. In Vietnamese history, it marks both liberation and loss, depending on political perspective and lived experience. The end of war did not end its consequences; they persisted in public health, land contamination, and collective memory.",
        category: "war",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Saigon-hubert-van-es.jpg/300px-Saigon-hubert-van-es.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Fall_of_Saigon" }],
      },
      {
        id: "ct26",
        title: "Iranian Revolution",
        year: 1979,
        yearLabel: "1979 CE",
        description:
          "The Iranian Revolution overthrew the Pahlavi monarchy through a broad coalition of clerical networks, secular activists, workers, students, and bazaar groups opposed to authoritarian rule, inequality, and perceived foreign domination. Revolutionary momentum accelerated as mass demonstrations, strikes, and state repression destabilized governance. The Shah’s departure and Ayatollah Khomeini’s return transformed political authority in rapid sequence.\n\nPost-revolutionary institutionalization consolidated clerical oversight through a new constitutional order combining republican forms with religious guardianship. Internal pluralism narrowed as competing factions were marginalized, exiled, or suppressed. The U.S. embassy hostage crisis internationalized the revolution’s antagonisms and fixed a durable rupture in U.S.-Iran relations.\n\nThe revolution’s regional and global effects were profound: new Islamist political imaginaries, altered Gulf security dynamics, and decades of sanctions, proxy conflict, and nuclear diplomacy. It remains a central case for analyzing revolutionary coalition dynamics, ideological state formation, and the interaction of domestic upheaval with international system pressures.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Mass_demonstration_in_Iran%2C_date_unknown.jpg/440px-Mass_demonstration_in_Iran%2C_date_unknown.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Iranian_Revolution" }],
      },
      {
        id: "ct27",
        title: "IBM Personal Computer Released",
        year: 1981,
        yearLabel: "1981 CE",
        description:
          "IBM’s launch of the Personal Computer in 1981 accelerated the transition of computing from specialized institutional environments to offices, schools, and homes. Although not the first personal computer, the IBM PC established a commercially influential architecture that encouraged third-party hardware compatibility and software ecosystems at scale. Standardization reduced adoption risk for businesses and expanded the market rapidly.\n\nThe platform’s growth strengthened software firms, especially around operating systems and productivity applications, and helped define the economic geography of the late twentieth-century digital sector. Component modularity and clone markets lowered costs, while networked computing later integrated PCs into global information infrastructures. The social effects included new labor practices, document workflows, and communication expectations.\n\nHistorically, the IBM PC represents a key node in digital capitalism: an inflection point where technical design choices, licensing structures, and market timing shaped decades of technological path dependence. Its legacy continues in contemporary debates over platform control, interoperability, and technological lock-in.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Ibm_pc_5150.jpg/440px-Ibm_pc_5150.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/IBM_Personal_Computer" }],
      },
      {
        id: "ct28",
        title: "HIV/AIDS Epidemic",
        year: 1981,
        yearLabel: "1981 CE",
        description:
          "The identification of AIDS cases in 1981 marked the beginning of a global public health crisis that would kill millions and expose deep social inequalities in care access, stigma, and political response. Early uncertainty about transmission, delayed state action, and discrimination against affected communities—especially gay men, people who inject drugs, sex workers, and marginalized populations—intensified the epidemic’s human cost.\n\nScientific progress gradually transformed outcomes. Discovery of HIV, expansion of testing, development of antiretroviral therapy, and prevention strategies such as PMTCT and later PrEP changed AIDS from a near-certain death sentence to a manageable chronic condition in many contexts. Yet treatment inequity remained severe across regions, especially where health systems were under-resourced.\n\nActivist organizations played a decisive role in reshaping medicine and policy, pressuring regulators, pharmaceutical firms, and governments for faster trials, lower prices, and patient-centered approaches. The epidemic’s legacy includes not only biomedical advances but also durable lessons about rights-based public health, global solidarity, and the politics of whose lives are treated as urgent.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_AIDS_Day_Ribbon.svg/300px-World_AIDS_Day_Ribbon.svg.png",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/HIV/AIDS" }],
      },
      {
        id: "ct29",
        title: "Chernobyl Nuclear Disaster",
        year: 1986,
        yearLabel: "1986 CE",
        description:
          "The Chernobyl disaster occurred in April 1986 when reactor number four exploded during a flawed safety test at a Soviet nuclear facility in present-day Ukraine. Design vulnerabilities in the RBMK reactor, procedural violations, and institutional safety culture failures combined to produce a catastrophic release of radioactive material. Initial emergency response was hampered by delayed disclosure and fragmented command authority.\n\nThe human and environmental consequences unfolded over decades. Immediate deaths were followed by long-term health burdens, displacement, and contamination across wide regions of Europe. Epidemiological estimation remains methodologically difficult and politically contested, especially regarding low-dose exposure effects; scholarly assessments therefore vary and include uncertainty disclaimers.\n\nChernobyl became a global turning point in nuclear governance and risk communication. It contributed to public distrust in Soviet institutions and influenced international safety standards, reactor design debates, and emergency planning. The event remains a central case in studies of technological catastrophe, transparency, and state accountability under high-consequence systems.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Chernobyl_NPP_Site_Panorama_with_NSC_Construction_-_June_2013.jpg/520px-Chernobyl_NPP_Site_Panorama_with_NSC_Construction_-_June_2013.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Chernobyl_disaster" }],
      },
      {
        id: "ct30",
        title: "Fall of the Berlin Wall",
        year: 1989,
        yearLabel: "1989 CE",
        description:
          "The opening of the Berlin Wall in November 1989 resulted from cumulative pressures: economic stagnation in Eastern Europe, reform signals from the Soviet Union, mass civic protests, and growing migration through neighboring states. A confused East German press announcement triggered immediate public movement to checkpoints, where border personnel—without clear operational directives—ultimately allowed crossings.\n\nThe event was globally interpreted as the symbolic end of Europe’s Cold War division. Yet reunification was not instantaneous; it required complex negotiations over currency, institutions, legal harmonization, and international security arrangements. For many East Germans, transition brought new freedoms alongside unemployment, deindustrialization, and social dislocation.\n\nIn long-term history, 1989 reshaped the European political map and accelerated the collapse of Soviet-aligned regimes. It also generated ongoing memory debates over dictatorship, resistance, and uneven outcomes of market transition. The wall’s fall remains both celebratory icon and reminder that systemic transformation redistributes costs as well as opportunities.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/West_and_East_Germans_at_the_Brandenburg_Gate_in_1989.jpg/520px-West_and_East_Germans_at_the_Brandenburg_Gate_in_1989.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Fall_of_the_Berlin_Wall" }],
      },
      {
        id: "ct31",
        title: "Tiananmen Square Protests",
        year: 1989,
        yearLabel: "1989 CE",
        description:
          "The 1989 protests centered in Beijing’s Tiananmen Square emerged from student mobilization but quickly expanded to include workers, intellectuals, and urban residents with diverse demands: anti-corruption reform, political accountability, media openness, and civic participation. Demonstrations were shaped by factional debates within Chinese leadership and by uncertainty over permissible dissent in a reform-era economy.\n\nMilitary suppression in June ended the occupation and produced significant casualties, though exact death tolls remain disputed due to restricted documentation and censorship. International reporting, diplomatic responses, and iconic imagery—especially the lone protester confronting tanks—made the crackdown a defining global human-rights reference point.\n\nDomestically, the event marked a turning point in state strategy: political tightening paired with accelerated market reforms. Public memory inside China has been heavily regulated, while diaspora communities and international scholarship preserve alternative archives. Tiananmen remains central to debates on authoritarian resilience, protest, and historical memory under censorship.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Tiananmen_Square%2C_Beijing%2C_China_1988_%281%29.jpg/440px-Tiananmen_Square%2C_Beijing%2C_China_1988_%281%29.jpg",
        sourceLinks: [
          { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/1989_Tiananmen_Square_protests" },
        ],
      },
      {
        id: "ct32",
        title: "World Wide Web Created",
        year: 1991,
        yearLabel: "1991 CE",
        description:
          "Tim Berners-Lee’s development of the World Wide Web at CERN in 1991 combined hypertext concepts, internet protocols, and browser interface design into a practical system for distributed information sharing. The web did not invent the internet but radically lowered barriers to use by making navigation and publishing more accessible to non-specialists. Open standards were central to this expansion.\n\nAs web adoption accelerated, digital economies and social communication shifted quickly. Search engines, e-commerce, online media, and platform ecosystems transformed labor, culture, and political discourse. The web also changed knowledge production by enabling rapid cross-border collaboration, though visibility became increasingly mediated by commercial ranking and attention incentives.\n\nLong-term, the web’s architecture generated both democratizing potentials and concentration dynamics. It expanded access to information while enabling surveillance capitalism, misinformation circulation, and regulatory struggles over speech and competition. Its history is therefore inseparable from governance debates about openness, accountability, and digital rights.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/First_Web_Server.jpg/440px-First_Web_Server.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/World_Wide_Web" }],
      },
      {
        id: "ct33",
        title: "Dissolution of the Soviet Union",
        year: 1991,
        yearLabel: "1991 CE",
        description:
          "The Soviet Union dissolved in 1991 after years of economic stagnation, political reform struggles, nationalist mobilization in constituent republics, and institutional fragmentation at the center. Gorbachev’s attempts at controlled liberalization (glasnost and perestroika) opened political space but also destabilized the coercive and ideological mechanisms that had sustained union cohesion. The failed August coup accelerated disintegration.\n\nFifteen independent states emerged from the former union, creating immediate challenges in currency systems, borders, military assets, and nuclear command arrangements. Economic transition toward market structures was often abrupt and socially costly, including inflation, unemployment, and sharp declines in life expectancy in parts of the post-Soviet space during the 1990s.\n\nGlobally, dissolution ended the bipolar Cold War framework and generated a brief period of unipolar U.S. predominance. Yet unresolved post-Soviet territorial and security disputes persisted, later contributing to renewed interstate conflict. The event remains central to understanding post-Cold War order and its fragilities.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/SovietUnionFSRs.svg/440px-SovietUnionFSRs.svg.png",
        sourceLinks: [
          {
            label: "Wikipedia",
            url: "https://en.wikipedia.org/wiki/Dissolution_of_the_Soviet_Union",
          },
        ],
      },
      {
        id: "ct34",
        title: "End of Apartheid in South Africa",
        year: 1994,
        yearLabel: "1994 CE",
        description:
          "South Africa’s 1994 democratic elections ended formal apartheid after decades of resistance by internal movements, labor unions, civic organizations, and international solidarity campaigns. Negotiations between the apartheid government and liberation movements unfolded amid violence, mistrust, and competing visions of constitutional transition. The election of Nelson Mandela symbolized a foundational shift in political legitimacy.\n\nInstitutional transformation included a new constitution, expanded suffrage, and legal dismantling of racial classification structures. The Truth and Reconciliation Commission pursued a model of conditional amnesty and testimony intended to document abuses while avoiding large-scale retaliatory cycles. Its outcomes remain debated: some view it as pragmatic restorative justice, others as insufficient for material redress.\n\nPost-apartheid South Africa achieved major democratic gains but inherited deep inequality in land, wealth, housing, and employment. The end of apartheid is therefore both a landmark victory and an ongoing project, demonstrating how formal regime change does not automatically resolve structural injustice.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nelson_Mandela_1994.jpg/300px-Nelson_Mandela_1994.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Nelson_Mandela" }],
      },
      {
        id: "ct35",
        title: "Rwandan Genocide",
        year: 1994,
        yearLabel: "1994 CE",
        description:
          "In 1994, extremist networks within Rwanda’s political and security institutions organized and executed mass killings targeting Tutsi civilians and moderate Hutu. The genocide unfolded at high speed, facilitated by militia mobilization, local administrative participation, propaganda, and coercion. In roughly one hundred days, casualty estimates generally center around eight hundred thousand, with uncertainty across datasets and regional records.\n\nInternational response was widely judged as catastrophic failure. UN peacekeeping mandates remained limited, foreign governments avoided timely intervention, and warning signals were inadequately acted upon. The killings ended only after military advances by the Rwandan Patriotic Front, which then formed a new government amid large refugee flows and subsequent regional conflict in the Great Lakes.\n\nThe genocide transformed international law and prevention discourse, influencing doctrines of mass-atrocity accountability and debates over humanitarian intervention. It remains a critical case for studying state capacity in violence, media incitement, and the consequences of delayed international action.",
        category: "war",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Kigali_Genocide_Memorial_-_Pair_of_Skulls.jpg/440px-Kigali_Genocide_Memorial_-_Pair_of_Skulls.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Rwandan_genocide" }],
      },
      {
        id: "ct36",
        title: "Dolly the Sheep Cloned",
        year: 1996,
        yearLabel: "1996 CE",
        description:
          "Dolly, announced in 1997 and cloned in 1996, was the first mammal produced from an adult somatic cell via nuclear transfer, demonstrating that differentiated cells could be reprogrammed to direct full organismal development. The experiment challenged assumptions about irreversible cellular specialization and opened new directions in developmental biology and regenerative medicine research.\n\nBeyond laboratory significance, Dolly triggered immediate ethical and regulatory debates on cloning, reproductive rights, animal welfare, and potential human applications. Governments, religious institutions, and scientific bodies responded with varied frameworks, often permitting therapeutic research while restricting reproductive cloning. Public reaction mixed scientific fascination with dystopian concern.\n\nHistorically, Dolly’s legacy lies in conceptual and technical pathways later used in stem-cell research and gene-editing contexts. The event illustrates how a single experimental success can rapidly migrate from specialist science into global bioethical politics and lawmaking.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Dolly_face_closeup.jpg/300px-Dolly_face_closeup.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Dolly_(sheep)" }],
      },
      {
        id: "ct37",
        title: "September 11 Terrorist Attacks",
        year: 2001,
        yearLabel: "2001 CE",
        description:
          "The September 11 attacks involved coordinated airline hijackings by al-Qaeda operatives targeting the World Trade Center and Pentagon, with a fourth aircraft crashing in Pennsylvania after passenger resistance. Nearly three thousand people were killed, and the attacks were broadcast globally in real time, producing immediate psychological and political shock.\n\nPolicy consequences were sweeping: U.S.-led military intervention in Afghanistan, expansion of global counterterror networks, new domestic security institutions, and broad surveillance authorities. The subsequent 'War on Terror' extended into Iraq and multiple theaters, with long-term human, financial, and legal costs that remain intensely debated.\n\n9/11 also transformed political discourse around migration, civil liberties, religion, and state violence. It became a central reference point in twenty-first century security governance, illustrating how non-state attacks can trigger prolonged geopolitical reconfiguration and contested emergency powers.",
        category: "war",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/September_11_Photo_Montage.jpg/440px-September_11_Photo_Montage.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/September_11_attacks" }],
      },
      {
        id: "ct38",
        title: "Human Genome Project Completed",
        year: 2003,
        yearLabel: "2003 CE",
        description:
          "The Human Genome Project, completed in 2003, mapped and sequenced most of the human genetic blueprint through an unprecedented international scientific collaboration. It required large-scale automation, computational infrastructure, and data-sharing norms that became templates for later 'big science' biology. The project’s outputs redefined the baseline of genomic knowledge.\n\nPractical impacts included improved disease-gene identification, new diagnostic tools, and foundations for personalized medicine approaches. Parallel private-sector sequencing efforts also shaped public-private competition and accelerated technological innovation. However, translation from sequence data to clinical outcomes proved more complex than early expectations, especially for polygenic and environment-sensitive conditions.\n\nThe project also raised durable ethical questions around privacy, discrimination, consent, and ownership of biological information. Its historical importance therefore includes institutional governance: it expanded what biology could measure while forcing society to confront how genomic knowledge should be regulated and distributed.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Part_of_DNA_sequence_protridge.jpg/440px-Part_of_DNA_sequence_protridge.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Human_Genome_Project" }],
      },
      {
        id: "ct39",
        title: "Indian Ocean Tsunami",
        year: 2004,
        yearLabel: "2004 CE",
        description:
          "A megathrust earthquake off Sumatra in December 2004 generated a transoceanic tsunami that struck multiple countries around the Indian Ocean basin. Wave arrival times and local topography produced highly uneven destruction, but overall human loss was immense, with death estimates commonly above two hundred thousand. Many victims were in coastal areas lacking warning systems or prepared evacuation routes.\n\nThe disaster exposed vulnerabilities in risk communication, emergency governance, and development planning in hazard-prone regions. International humanitarian response was massive, but recovery processes varied sharply by state capacity, conflict conditions, and local social organization. Reconstruction debates included relocation policy, livelihood restoration, and equitable aid distribution.\n\nLong-term, the tsunami accelerated regional early-warning infrastructure and improved disaster-coordination protocols. It remains a major case for understanding how natural hazards become social catastrophes when exposure, inequality, and institutional preparedness intersect.",
        category: "geology",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/US_Navy_050102-N-9593M-040_A_village_near_the_coast_of_Sumatra_lays_in_ruin_after_the_Tsunami_that_struck_South_East_Asia.jpg/520px-US_Navy_050102-N-9593M-040_A_village_near_the_coast_of_Sumatra_lays_in_ruin_after_the_Tsunami_that_struck_South_East_Asia.jpg",
        sourceLinks: [
          {
            label: "Wikipedia",
            url: "https://en.wikipedia.org/wiki/2004_Indian_Ocean_earthquake_and_tsunami",
          },
        ],
      },
      {
        id: "ct40",
        title: "Global Financial Crisis",
        year: 2008,
        yearLabel: "2008 CE",
        description:
          "The 2008 global financial crisis emerged from interconnected vulnerabilities in mortgage lending, securitization, leverage, and risk mispricing across transnational financial institutions. When housing markets deteriorated and credit confidence collapsed, liquidity froze and major firms failed or required emergency support. The crisis rapidly spread through globally integrated banking and trade systems.\n\nGovernments and central banks responded with extraordinary interventions: bank recapitalization, guarantees, monetary easing, and fiscal stimulus in varying combinations. These actions prevented deeper systemic collapse but generated political backlash over moral hazard and unequal recovery burdens. Labor markets, household wealth, and public budgets were damaged for years, with uneven effects across class and region.\n\nThe crisis reshaped regulatory debate and political alignments. It intensified criticism of deregulated finance, contributed to austerity disputes, and fueled populist mobilizations across ideological spectra. Its long-term significance lies in showing how financial architecture can transmit private risk into global social crisis.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Lehman_Brothers_Times_Square_by_David_Shankbone.jpg/440px-Lehman_Brothers_Times_Square_by_David_Shankbone.jpg",
        sourceLinks: [
          { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Financial_crisis_of_2007%E2%80%932008" },
        ],
      },
      {
        id: "ct41",
        title: "Election of Barack Obama",
        year: 2008,
        yearLabel: "2008 CE",
        description:
          "Barack Obama’s election as U.S. president in 2008 was a major symbolic and political milestone in a country with a long history of racial exclusion. The campaign mobilized broad coalitions, digital organizing methods, and high youth participation while unfolding during economic crisis and fatigue with ongoing wars. Internationally, the election was widely interpreted as a signal of possible policy and image reset.\n\nSymbolic significance did not erase structural inequality. Obama’s presidency operated within polarized institutions and encountered sustained opposition, including racialized delegitimation campaigns. Policy outcomes included major health-care reform, financial stabilization measures, and changing executive approaches to climate and diplomacy, but with mixed durability under subsequent administrations.\n\nHistorically, the election is best understood as both breakthrough and constraint: a powerful marker in democratic representation and a reminder that representation alone cannot resolve entrenched social hierarchies. It remains central to analyses of race, leadership, and post-civil-rights political narratives in the United States.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/300px-President_Barack_Obama.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Barack_Obama" }],
      },
      {
        id: "ct42",
        title: "Arab Spring",
        year: 2011,
        yearLabel: "2011 CE",
        description:
          "The Arab Spring refers to a wave of uprisings that spread across the Middle East and North Africa beginning in late 2010 and accelerating in 2011. Triggered by local grievances—unemployment, corruption, police abuse, and restricted political participation—protests drew strength from cross-border media circulation and digital communication. National trajectories diverged quickly according to regime structures, military alignments, and external intervention.\n\nSome governments fell, others adapted, and several states descended into prolonged conflict. Tunisia experienced constitutional transition (later facing democratic backsliding), while Syria, Libya, and Yemen entered devastating wars with regional and international entanglements. Egypt’s brief electoral opening was followed by military re-consolidation. The period exposed both possibility and fragility in authoritarian transformation.\n\nThe Arab Spring’s historical significance lies in its uneven outcomes rather than a single narrative arc. It demonstrated the mobilizing power of collective dissent while highlighting how institutions, class coalitions, and geopolitical intervention shape whether protest produces reform, repression, or war.",
        category: "politics",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Tahrir_Square_on_February11.png/440px-Tahrir_Square_on_February11.png",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Arab_Spring" }],
      },
      {
        id: "ct43",
        title: "Discovery of the Higgs Boson",
        year: 2012,
        yearLabel: "2012 CE",
        description:
          "In 2012, CERN experiments announced evidence for a new particle consistent with the Higgs boson, a long-predicted component of the Standard Model explaining how certain particles acquire mass through field interactions. The result followed decades of theoretical work, technological innovation in detectors and accelerators, and large-scale international collaboration.\n\nThe discovery did not 'finish' physics, but it confirmed a crucial part of an established framework and narrowed uncertainty in particle theory. It also highlighted the organizational complexity of contemporary science: thousands of researchers, distributed computing infrastructures, and publicly funded facilities coordinated across borders for single high-stakes measurements.\n\nHistorically, the Higgs discovery is significant both scientifically and institutionally. It validated long-range investment in fundamental research while reinforcing ongoing questions about what lies beyond the Standard Model, including dark matter, neutrino mass hierarchies, and quantum gravity.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/CMS_Higgs-event.jpg/440px-CMS_Higgs-event.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Higgs_boson" }],
      },
      {
        id: "ct44",
        title: "Paris Climate Agreement",
        year: 2015,
        yearLabel: "2015 CE",
        description:
          "The Paris Agreement of 2015 established a globally shared framework for climate mitigation and adaptation, with states committing to submit and periodically strengthen nationally determined contributions. Unlike older top-down models, the agreement combined universal participation with flexible domestic pathways, aiming to align political feasibility with escalating scientific urgency.\n\nIts significance rests in norm consolidation as much as immediate emission outcomes. Paris embedded temperature goals, transparency mechanisms, and expectations of progressive ambition into international diplomacy. It also foregrounded climate finance and differentiated responsibilities, though funding and loss-and-damage debates remain contentious between high- and low-emission states.\n\nImplementation gaps are substantial: current policy trajectories remain inconsistent with safer warming thresholds. Even so, Paris reshaped policy baselines for governments, firms, and courts, and it provided a common reference architecture for climate governance in an era of compounding ecological risk.",
        category: "treaty",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/COP21_participants_-_30_Nov_2015_%2823430273715%29.jpg/520px-COP21_participants_-_30_Nov_2015_%2823430273715%29.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Paris_Agreement" }],
      },
      {
        id: "ct45",
        title: "Gravitational Waves Detected",
        year: 2016,
        yearLabel: "2016 CE",
        description:
          "The first confirmed detection of gravitational waves by LIGO, announced in 2016, provided direct observational evidence for a central prediction of Einstein’s general relativity. The signal originated from merging black holes over a billion light-years away, captured as minute distortions in spacetime measured by exquisitely sensitive laser interferometry.\n\nThe achievement opened a new observational channel in astronomy: gravitational-wave astronomy. Instead of relying only on electromagnetic radiation, scientists could now study violent cosmic events through spacetime perturbations themselves. Subsequent detections, including neutron-star mergers, linked gravitational and electromagnetic observations, creating a multi-messenger research paradigm.\n\nHistorically, the detection demonstrates the payoff of long-horizon, high-precision experimental science. It also underscores how foundational physics can generate entirely new empirical windows on the universe, reshaping questions about stellar evolution, compact objects, and cosmological history.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/LIGO_measurement_of_gravitational_waves.svg/440px-LIGO_measurement_of_gravitational_waves.svg.png",
        sourceLinks: [
          {
            label: "Wikipedia",
            url: "https://en.wikipedia.org/wiki/First_observation_of_gravitational_waves",
          },
        ],
      },
      {
        id: "ct46",
        title: "COVID-19 Pandemic",
        year: 2020,
        yearLabel: "2020 CE",
        description:
          "The COVID-19 pandemic spread globally after the emergence of SARS-CoV-2, producing a multidimensional crisis across public health, labor markets, education systems, and political institutions. National responses varied widely in timing, messaging, and enforcement capacity, and these differences shaped mortality patterns, social disruption, and economic recovery trajectories.\n\nScientific and medical mobilization was historically rapid, including genomic sequencing, diagnostics, treatment trials, and vaccine development—most notably mRNA platforms deployed at unprecedented scale. Yet distribution inequities, misinformation ecosystems, and uneven healthcare access limited benefits, especially in lower-resource settings. Official death counts exceeded millions, while excess-mortality analyses suggest broader impact with measurement uncertainty across jurisdictions.\n\nThe pandemic’s long-term significance includes institutional learning and institutional failure: improved preparedness tools in some sectors, but also deepened inequality, trust erosion, and persistent post-acute health burdens. COVID-19 remains a defining event for analyzing global interdependence and governance under systemic shock.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/SARS-CoV-2_without_background.png/440px-SARS-CoV-2_without_background.png",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/COVID-19_pandemic" }],
      },
      {
        id: "ct47",
        title: "Russia Invades Ukraine",
        year: 2022,
        yearLabel: "2022 CE",
        description:
          "Russia’s full-scale invasion of Ukraine in February 2022 escalated a conflict that had already included annexation and proxy warfare since 2014. Initial Russian expectations of rapid collapse were met by broad Ukrainian resistance, decentralized defense, and substantial international support in military aid, intelligence, and sanctions coordination. The war quickly became a major test of contemporary security order in Europe.\n\nHumanitarian impacts have been severe: civilian deaths, infrastructure destruction, displacement of millions, and enduring trauma. Documentation efforts by journalists, NGOs, and legal bodies have focused on potential war crimes and accountability pathways, though legal outcomes are typically long-term and politically complex. Economic consequences spread globally through energy, food, and supply-chain disruptions.\n\nStrategically, the invasion reshaped alliance politics, defense spending, and debates over deterrence in a nuclear-armed environment. It remains an ongoing conflict with uncertain end state, but already stands as a defining event in twenty-first century geopolitics and international law discourse.",
        category: "war",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Kyiv_after_Russian_shelling%2C_14_March_2022_%2801%29.jpg/440px-Kyiv_after_Russian_shelling%2C_14_March_2022_%2801%29.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Russian_invasion_of_Ukraine" }],
      },
      {
        id: "ct48",
        title: "James Webb Space Telescope Reveals the Universe",
        year: 2022,
        yearLabel: "2022 CE",
        description:
          "The James Webb Space Telescope began returning science images in 2022 after a high-risk deployment sequence at the Sun-Earth L2 point. Designed for infrared observation, Webb can detect faint and distant sources obscured or shifted beyond earlier optical instruments, enabling new views of early galaxies, star formation regions, and exoplanet atmospheres.\n\nEarly data exceeded many expectations for clarity and depth, providing high-impact observations for cosmology and planetary science. Spectroscopic analysis expanded ability to characterize atmospheric chemistry beyond the solar system, while deep-field imagery pushed empirical access toward earlier cosmic epochs. Webb’s mission illustrates cumulative engineering progress in optics, cryogenics, and precision systems control.\n\nHistorically, Webb extends rather than replaces previous observatories, creating continuity across decades of space-based astronomy. Its significance lies not only in spectacular imagery but in long-duration data production that will reshape models of cosmic structure and habitability research for years to come.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Webb%27s_First_Deep_Field.jpg/440px-Webb%27s_First_Deep_Field.jpg",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/James_Webb_Space_Telescope" }],
      },
      {
        id: "ct49",
        title: "ChatGPT and the AI Revolution",
        year: 2023,
        yearLabel: "2023 CE",
        description:
          "The mass adoption of conversational generative AI systems in 2023 marked a major shift in how machine learning entered public and workplace life. Large language models moved from specialized research communities into education, customer service, software development, media production, and everyday information workflows. Rapid user growth reflected both technical capability and low-friction interface design.\n\nThe expansion triggered immediate debates over reliability, labor displacement, intellectual property, bias, and governance. While these systems demonstrated new forms of language and reasoning-like performance, they also produced errors, fabricated citations, and uneven outputs across contexts. Organizations began integrating AI tools while simultaneously building review, compliance, and safety policies.\n\nHistorically, 2023 is likely to be seen as a commercialization inflection point rather than a technological endpoint. The period established regulatory agendas, accelerated model competition, and normalized human-AI collaboration practices that will shape economic and institutional adaptation through the coming decade.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/440px-ChatGPT_logo.svg.png",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/ChatGPT" }],
      },
      {
        id: "ct50",
        title: "First Gene-Edited Therapy Approved",
        year: 2023,
        yearLabel: "2023 CE",
        description:
          "Regulatory approval of the first CRISPR-based therapy in 2023 marked a clinical milestone in genomic medicine. The treatment targets severe blood disorders by editing patient-derived cells to restore beneficial hemoglobin production, translating years of experimental gene-editing research into approved therapeutic practice. The approval demonstrated that precise genome modification could move from proof-of-concept to health-system use.\n\nClinical significance is substantial for affected patients, but deployment raises practical and ethical challenges: manufacturing complexity, treatment cost, long-term monitoring, informed consent, and equitable access across countries. As with many advanced biologics, scientific breakthrough does not automatically imply global availability or affordability.\n\nHistorically, this moment signals the start of a new therapeutic era rather than completion of one. It establishes regulatory precedent for future gene-editing interventions and intensifies debate over boundaries between somatic treatment, enhancement concerns, and broader governance of human genomic technologies.",
        category: "science",
        era: "contemporary",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/GRNA-Cas9.svg/440px-GRNA-Cas9.svg.png",
        sourceLinks: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Casgevy" }],
      },
    ],
  },
];
