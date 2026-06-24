import type { QAItem } from "@/lib/types";

/**
 * Hand-authored Q&A bank. In production these are generated/expanded by the
 * Claude agent (see lib/agent.ts) and cached; here we ship a real, playable set
 * per skill so every session is genuinely answerable in both languages.
 */

const XP = { beginner: 10, intermediate: 15, advanced: 25 } as const;

export const CONTENT: QAItem[] = [
  /* ---------------- SAT ---------------- */
  {
    id: "sat-1",
    skillId: "sat",
    difficulty: "beginner",
    format: "mcq",
    question: { en: "If 3x + 5 = 20, what is x?", pl: "Jeśli 3x + 5 = 20, ile wynosi x?" },
    options: { en: ["3", "5", "15", "45"], pl: ["3", "5", "15", "45"] },
    correctIndex: 1,
    explanation: {
      en: "Subtract 5: 3x = 15. Divide by 3: x = 5.",
      pl: "Odejmij 5: 3x = 15. Podziel przez 3: x = 5.",
    },
    hint: { en: "Isolate the term with x first.", pl: "Najpierw wyizoluj wyraz z x." },
    xp: XP.beginner,
  },
  {
    id: "sat-2",
    skillId: "sat",
    difficulty: "beginner",
    format: "mcq",
    question: {
      en: "Which sentence is punctuated correctly?",
      pl: "Które zdanie jest poprawnie interpunkcyjnie?",
    },
    options: {
      en: [
        "We packed bags, snacks, and maps.",
        "We packed bags snacks and maps.",
        "We packed, bags, snacks and maps.",
        "We packed bags, snacks and, maps.",
      ],
      pl: [
        "We packed bags, snacks, and maps.",
        "We packed bags snacks and maps.",
        "We packed, bags, snacks and maps.",
        "We packed bags, snacks and, maps.",
      ],
    },
    correctIndex: 0,
    explanation: {
      en: "Items in a series are separated by commas, including before the final 'and' (the Oxford comma is accepted on the SAT).",
      pl: "Elementy wyliczenia oddzielamy przecinkami, także przed końcowym „and” (przecinek oksfordzki jest akceptowany na SAT).",
    },
    xp: XP.beginner,
  },
  {
    id: "sat-3",
    skillId: "sat",
    difficulty: "intermediate",
    format: "mcq",
    question: { en: "If f(x) = 2x² − 3x + 1, what is f(2)?", pl: "Jeśli f(x) = 2x² − 3x + 1, ile wynosi f(2)?" },
    options: { en: ["1", "3", "5", "11"], pl: ["1", "3", "5", "11"] },
    correctIndex: 1,
    explanation: {
      en: "2(4) − 3(2) + 1 = 8 − 6 + 1 = 3.",
      pl: "2(4) − 3(2) + 1 = 8 − 6 + 1 = 3.",
    },
    xp: XP.intermediate,
  },
  {
    id: "sat-4",
    skillId: "sat",
    difficulty: "intermediate",
    format: "mcq",
    question: {
      en: "In context, 'meticulous' most nearly means:",
      pl: "W kontekście słowo „meticulous” znaczy najbliżej:",
    },
    options: {
      en: ["careless", "careful", "rapid", "loud"],
      pl: ["niedbały", "staranny", "szybki", "głośny"],
    },
    correctIndex: 1,
    explanation: {
      en: "'Meticulous' describes showing great attention to detail — careful.",
      pl: "„Meticulous” oznacza dużą dbałość o szczegóły — staranny.",
    },
    xp: XP.intermediate,
  },
  {
    id: "sat-5",
    skillId: "sat",
    difficulty: "advanced",
    format: "mcq",
    question: {
      en: "A circle has an area of 36π. What is its circumference?",
      pl: "Koło ma pole 36π. Jaki jest jego obwód?",
    },
    options: { en: ["6π", "12π", "18π", "36π"], pl: ["6π", "12π", "18π", "36π"] },
    correctIndex: 1,
    explanation: {
      en: "Area = πr² = 36π ⇒ r = 6. Circumference = 2πr = 12π.",
      pl: "Pole = πr² = 36π ⇒ r = 6. Obwód = 2πr = 12π.",
    },
    hint: { en: "Find the radius from the area first.", pl: "Najpierw wyznacz promień z pola." },
    xp: XP.advanced,
  },
  {
    id: "sat-6",
    skillId: "sat",
    difficulty: "advanced",
    format: "mcq",
    question: {
      en: "The mean of 5 numbers is 12. A sixth number, 18, is added. What is the new mean?",
      pl: "Średnia 5 liczb wynosi 12. Dodano szóstą liczbę, 18. Jaka jest nowa średnia?",
    },
    options: { en: ["12", "13", "14", "15"], pl: ["12", "13", "14", "15"] },
    correctIndex: 1,
    explanation: {
      en: "Sum = 5 × 12 = 60; new sum = 78; 78 ÷ 6 = 13.",
      pl: "Suma = 5 × 12 = 60; nowa suma = 78; 78 ÷ 6 = 13.",
    },
    xp: XP.advanced,
  },

  /* ---------------- GMAT ---------------- */
  {
    id: "gmat-1",
    skillId: "gmat",
    difficulty: "beginner",
    format: "mcq",
    question: {
      en: "A shirt costs $40 after a 20% discount. What was the original price?",
      pl: "Koszula kosztuje 40 zł po 20% rabacie. Jaka była cena pierwotna?",
    },
    options: { en: ["$44", "$48", "$50", "$60"], pl: ["44", "48", "50", "60"] },
    correctIndex: 2,
    explanation: {
      en: "$40 is 80% of the original: 40 ÷ 0.8 = 50.",
      pl: "40 to 80% ceny pierwotnej: 40 ÷ 0,8 = 50.",
    },
    xp: XP.beginner,
  },
  {
    id: "gmat-2",
    skillId: "gmat",
    difficulty: "beginner",
    format: "mcq",
    question: {
      en: "What is 15% of 240?",
      pl: "Ile to jest 15% z 240?",
    },
    options: { en: ["24", "30", "36", "40"], pl: ["24", "30", "36", "40"] },
    correctIndex: 2,
    explanation: { en: "10% = 24, 5% = 12, so 15% = 36.", pl: "10% = 24, 5% = 12, więc 15% = 36." },
    xp: XP.beginner,
  },
  {
    id: "gmat-3",
    skillId: "gmat",
    difficulty: "intermediate",
    format: "mcq",
    question: {
      en: "If x/y = 3/4 and y = 8, what is x?",
      pl: "Jeśli x/y = 3/4 oraz y = 8, ile wynosi x?",
    },
    options: { en: ["4", "6", "8", "12"], pl: ["4", "6", "8", "12"] },
    correctIndex: 1,
    explanation: { en: "x = (3/4) × 8 = 6.", pl: "x = (3/4) × 8 = 6." },
    xp: XP.intermediate,
  },
  {
    id: "gmat-4",
    skillId: "gmat",
    difficulty: "intermediate",
    format: "mcq",
    question: {
      en: "An argument concludes a new ad doubled sales. Which finding most weakens it?",
      pl: "Argument głosi, że nowa reklama podwoiła sprzedaż. Co najbardziej go osłabia?",
    },
    options: {
      en: [
        "A competitor closed during the same period.",
        "The ad was shown nationwide.",
        "Sales are measured in dollars.",
        "The company has run ads before.",
      ],
      pl: [
        "Konkurent zamknął się w tym samym okresie.",
        "Reklama była pokazywana w całym kraju.",
        "Sprzedaż mierzona jest w złotówkach.",
        "Firma reklamowała się już wcześniej.",
      ],
    },
    correctIndex: 0,
    explanation: {
      en: "An alternative cause (the competitor closing) could explain the sales jump, weakening the claim that the ad caused it.",
      pl: "Alternatywna przyczyna (zamknięcie konkurenta) mogła wywołać wzrost sprzedaży, co osłabia tezę o wpływie reklamy.",
    },
    xp: XP.intermediate,
  },
  {
    id: "gmat-5",
    skillId: "gmat",
    difficulty: "advanced",
    format: "mcq",
    question: {
      en: "Two pipes fill a tank in 6 and 12 hours. Working together, how long?",
      pl: "Dwie rury napełniają zbiornik w 6 i 12 godzin. Razem — ile czasu?",
    },
    options: { en: ["3 h", "4 h", "8 h", "9 h"], pl: ["3 h", "4 h", "8 h", "9 h"] },
    correctIndex: 1,
    explanation: {
      en: "Rates add: 1/6 + 1/12 = 1/4 tank per hour ⇒ 4 hours.",
      pl: "Wydajności się dodają: 1/6 + 1/12 = 1/4 zbiornika na godzinę ⇒ 4 godziny.",
    },
    hint: { en: "Add the rates, not the times.", pl: "Dodawaj wydajności, nie czasy." },
    xp: XP.advanced,
  },
  {
    id: "gmat-6",
    skillId: "gmat",
    difficulty: "advanced",
    format: "mcq",
    question: {
      en: "What is the probability of getting at least one head in two fair coin flips?",
      pl: "Jakie jest prawdopodobieństwo wyrzucenia co najmniej jednego orła w dwóch rzutach monetą?",
    },
    options: { en: ["1/4", "1/2", "3/4", "1"], pl: ["1/4", "1/2", "3/4", "1"] },
    correctIndex: 2,
    explanation: {
      en: "P(no heads) = 1/2 × 1/2 = 1/4, so P(at least one) = 1 − 1/4 = 3/4.",
      pl: "P(brak orła) = 1/2 × 1/2 = 1/4, więc P(co najmniej jeden) = 1 − 1/4 = 3/4.",
    },
    xp: XP.advanced,
  },

  /* ---------------- Interpersonal ---------------- */
  {
    id: "interpersonal-1",
    skillId: "interpersonal",
    difficulty: "beginner",
    format: "mcq",
    question: { en: "What best describes active listening?", pl: "Co najlepiej opisuje aktywne słuchanie?" },
    options: {
      en: [
        "Planning your reply while they talk",
        "Fully focusing, understanding, then responding",
        "Nodding without paying attention",
        "Waiting for your turn to speak",
      ],
      pl: [
        "Planowanie odpowiedzi, gdy ktoś mówi",
        "Pełne skupienie, zrozumienie, a potem odpowiedź",
        "Kiwanie głową bez uwagi",
        "Czekanie na swoją kolej",
      ],
    },
    correctIndex: 1,
    explanation: {
      en: "Active listening means concentrating fully, understanding, and responding to what was actually said.",
      pl: "Aktywne słuchanie to pełne skupienie, zrozumienie i odpowiedź na to, co naprawdę powiedziano.",
    },
    xp: XP.beginner,
  },
  {
    id: "interpersonal-2",
    skillId: "interpersonal",
    difficulty: "beginner",
    format: "mcq",
    question: {
      en: "A colleague is visibly frustrated. What's the best first response?",
      pl: "Współpracownik jest wyraźnie sfrustrowany. Jaka jest najlepsza pierwsza reakcja?",
    },
    options: {
      en: [
        "Tell them to calm down",
        "Acknowledge how they feel",
        "Immediately offer a solution",
        "Change the subject",
      ],
      pl: [
        "Powiedzieć, żeby się uspokoili",
        "Uznać to, co czują",
        "Od razu zaproponować rozwiązanie",
        "Zmienić temat",
      ],
    },
    correctIndex: 1,
    explanation: {
      en: "Acknowledging emotion first (empathy) defuses tension before problem-solving.",
      pl: "Uznanie emocji (empatia) rozładowuje napięcie, zanim przejdziemy do rozwiązań.",
    },
    xp: XP.beginner,
  },
  {
    id: "interpersonal-3",
    skillId: "interpersonal",
    difficulty: "intermediate",
    format: "mcq",
    question: { en: "Why use 'I' statements (e.g. 'I feel…')?", pl: "Po co stosować komunikaty „ja” (np. „czuję, że…”)?" },
    options: {
      en: [
        "To assign blame clearly",
        "To express feelings without accusing",
        "To avoid the topic",
        "To sound more formal",
      ],
      pl: [
        "By jasno przypisać winę",
        "By wyrazić uczucia bez oskarżania",
        "By uniknąć tematu",
        "By brzmieć bardziej formalnie",
      ],
    },
    correctIndex: 1,
    explanation: {
      en: "'I' statements express your experience without blaming, which lowers defensiveness.",
      pl: "Komunikaty „ja” wyrażają Twoje przeżycia bez obwiniania, co zmniejsza postawę obronną.",
    },
    xp: XP.intermediate,
  },
  {
    id: "interpersonal-4",
    skillId: "interpersonal",
    difficulty: "intermediate",
    format: "mcq",
    question: { en: "In negotiation, what does BATNA stand for?", pl: "Co w negocjacjach oznacza BATNA?" },
    options: {
      en: [
        "Best Alternative To a Negotiated Agreement",
        "Basic Agreement Terms and Negotiation Approach",
        "Balanced Approach To Neutral Arbitration",
        "Best AchievableTerms, Negotiated Annually",
      ],
      pl: [
        "Best Alternative To a Negotiated Agreement (najlepsza alternatywa)",
        "Podstawowe warunki i podejście negocjacyjne",
        "Zrównoważone podejście do neutralnego arbitrażu",
        "Najlepsze osiągalne warunki, negocjowane rocznie",
      ],
    },
    correctIndex: 0,
    explanation: {
      en: "Your BATNA is your best option if the negotiation fails — it sets your walk-away point.",
      pl: "BATNA to Twoja najlepsza opcja, gdy negocjacje się nie powiodą — wyznacza granicę odejścia.",
    },
    xp: XP.intermediate,
  },
  {
    id: "interpersonal-5",
    skillId: "interpersonal",
    difficulty: "advanced",
    format: "mcq",
    question: { en: "Which feedback is most constructive?", pl: "Która informacja zwrotna jest najbardziej konstruktywna?" },
    options: {
      en: [
        "'You're careless with reports.'",
        "'In yesterday's report, three figures were off — let's check the source.'",
        "'The report was bad.'",
        "'Everyone thinks your reports need work.'",
      ],
      pl: [
        "„Jesteś niedbały przy raportach.”",
        "„We wczorajszym raporcie trzy liczby się nie zgadzały — sprawdźmy źródło.”",
        "„Raport był zły.”",
        "„Wszyscy uważają, że Twoje raporty wymagają poprawy.”",
      ],
    },
    correctIndex: 1,
    explanation: {
      en: "Effective feedback is specific, behavior-focused and tied to a concrete example — not a character judgment.",
      pl: "Skuteczny feedback jest konkretny, skupiony na zachowaniu i oparty na przykładzie — nie ocenia charakteru.",
    },
    xp: XP.advanced,
  },
  {
    id: "interpersonal-6",
    skillId: "interpersonal",
    difficulty: "advanced",
    format: "mcq",
    question: {
      en: "A teammate repeatedly interrupts you in meetings. Best first step?",
      pl: "Członek zespołu wciąż Ci przerywa na spotkaniach. Najlepszy pierwszy krok?",
    },
    options: {
      en: [
        "Interrupt them back to make a point",
        "Raise it privately with specific examples",
        "Complain to the whole team",
        "Say nothing and hope it stops",
      ],
      pl: [
        "Przerwać im, by coś udowodnić",
        "Poruszyć to na osobności, z konkretnymi przykładami",
        "Poskarżyć się całemu zespołowi",
        "Nic nie mówić i liczyć, że minie",
      ],
    },
    correctIndex: 1,
    explanation: {
      en: "A private, specific conversation addresses the behavior without public embarrassment and invites change.",
      pl: "Prywatna, konkretna rozmowa adresuje zachowanie bez publicznego zawstydzania i zachęca do zmiany.",
    },
    xp: XP.advanced,
  },

  /* ---------------- Engineering ---------------- */
  {
    id: "engineering-1",
    skillId: "engineering",
    difficulty: "beginner",
    format: "mcq",
    question: { en: "What is the SI unit of force?", pl: "Jaka jest jednostka siły w układzie SI?" },
    options: { en: ["Joule", "Newton", "Watt", "Pascal"], pl: ["Dżul", "Niuton", "Wat", "Paskal"] },
    correctIndex: 1,
    explanation: { en: "Force is measured in newtons (N = kg·m/s²).", pl: "Siłę mierzymy w niutonach (N = kg·m/s²)." },
    xp: XP.beginner,
  },
  {
    id: "engineering-2",
    skillId: "engineering",
    difficulty: "beginner",
    format: "mcq",
    question: { en: "What does a resistor do in a circuit?", pl: "Co robi rezystor w obwodzie?" },
    options: {
      en: ["Stores charge", "Limits current", "Generates voltage", "Amplifies signal"],
      pl: ["Magazynuje ładunek", "Ogranicza prąd", "Wytwarza napięcie", "Wzmacnia sygnał"],
    },
    correctIndex: 1,
    explanation: {
      en: "A resistor opposes current flow, limiting it according to Ohm's law (V = IR).",
      pl: "Rezystor przeciwstawia się przepływowi prądu, ograniczając go zgodnie z prawem Ohma (V = IR).",
    },
    xp: XP.beginner,
  },
  {
    id: "engineering-3",
    skillId: "engineering",
    difficulty: "intermediate",
    format: "mcq",
    question: {
      en: "The factor of safety is the ratio of:",
      pl: "Współczynnik bezpieczeństwa to stosunek:",
    },
    options: {
      en: [
        "Working stress to density",
        "Material strength to working stress",
        "Mass to volume",
        "Voltage to current",
      ],
      pl: [
        "Naprężenia roboczego do gęstości",
        "Wytrzymałości materiału do naprężenia roboczego",
        "Masy do objętości",
        "Napięcia do prądu",
      ],
    },
    correctIndex: 1,
    explanation: {
      en: "Factor of safety = material strength ÷ actual working stress; higher means more margin.",
      pl: "Współczynnik bezpieczeństwa = wytrzymałość ÷ rzeczywiste naprężenie robocze; wyższy = większy zapas.",
    },
    xp: XP.intermediate,
  },
  {
    id: "engineering-4",
    skillId: "engineering",
    difficulty: "intermediate",
    format: "mcq",
    question: { en: "What is the time complexity of binary search?", pl: "Jaka jest złożoność czasowa wyszukiwania binarnego?" },
    options: { en: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], pl: ["O(n)", "O(log n)", "O(n log n)", "O(1)"] },
    correctIndex: 1,
    explanation: {
      en: "Each step halves the search space, giving logarithmic time, O(log n).",
      pl: "Każdy krok połowi przeszukiwany zbiór, co daje czas logarytmiczny, O(log n).",
    },
    xp: XP.intermediate,
  },
  {
    id: "engineering-5",
    skillId: "engineering",
    difficulty: "advanced",
    format: "mcq",
    question: {
      en: "In a cantilever beam with a load at the free end, the maximum bending moment is at:",
      pl: "W belce wspornikowej z obciążeniem na swobodnym końcu maksymalny moment gnący jest:",
    },
    options: {
      en: ["The free end", "The midpoint", "The fixed support", "It is constant"],
      pl: ["Na swobodnym końcu", "W połowie", "Przy utwierdzeniu", "Jest stały"],
    },
    correctIndex: 2,
    explanation: {
      en: "Bending moment grows with distance from the load, peaking at the fixed support.",
      pl: "Moment gnący rośnie z odległością od obciążenia, osiągając maksimum przy utwierdzeniu.",
    },
    xp: XP.advanced,
  },
  {
    id: "engineering-6",
    skillId: "engineering",
    difficulty: "advanced",
    format: "mcq",
    question: {
      en: "A system has 99.9% uptime. Roughly how much downtime is that per year?",
      pl: "System ma 99,9% dostępności. Ile to mniej więcej przestoju rocznie?",
    },
    options: {
      en: ["~52 minutes", "~8.8 hours", "~3.6 days", "~36 hours"],
      pl: ["~52 minuty", "~8,8 godziny", "~3,6 dnia", "~36 godzin"],
    },
    correctIndex: 1,
    explanation: {
      en: "0.1% of 8,760 hours ≈ 8.76 hours of downtime per year.",
      pl: "0,1% z 8760 godzin ≈ 8,76 godziny przestoju rocznie.",
    },
    hint: { en: "A year is about 8,760 hours.", pl: "Rok to około 8760 godzin." },
    xp: XP.advanced,
  },

  /* ---------------- AI ---------------- */
  {
    id: "ai-1",
    skillId: "ai",
    difficulty: "beginner",
    format: "mcq",
    question: { en: "What does 'LLM' stand for?", pl: "Co oznacza skrót „LLM”?" },
    options: {
      en: ["Large Language Model", "Linear Learning Method", "Logical Layer Map", "Long List Memory"],
      pl: ["Large Language Model (duży model językowy)", "Liniowa metoda uczenia", "Mapa warstw logicznych", "Pamięć długiej listy"],
    },
    correctIndex: 0,
    explanation: {
      en: "An LLM is a Large Language Model trained on vast text to predict and generate language.",
      pl: "LLM to duży model językowy trenowany na ogromnych zbiorach tekstu do przewidywania i generowania języka.",
    },
    xp: XP.beginner,
  },
  {
    id: "ai-2",
    skillId: "ai",
    difficulty: "beginner",
    format: "mcq",
    question: { en: "Supervised learning requires:", pl: "Uczenie nadzorowane wymaga:" },
    options: {
      en: ["Labeled data", "No data", "Only images", "A human in the loop at all times"],
      pl: ["Danych z etykietami", "Braku danych", "Tylko obrazów", "Stałej obecności człowieka"],
    },
    correctIndex: 0,
    explanation: {
      en: "Supervised learning trains on input–output pairs, i.e. labeled examples.",
      pl: "Uczenie nadzorowane trenuje na parach wejście–wyjście, czyli na przykładach z etykietami.",
    },
    xp: XP.beginner,
  },
  {
    id: "ai-3",
    skillId: "ai",
    difficulty: "intermediate",
    format: "mcq",
    question: { en: "What is 'overfitting'?", pl: "Czym jest „przeuczenie” (overfitting)?" },
    options: {
      en: [
        "A model that's too simple to learn",
        "A model that memorizes training data and generalizes poorly",
        "Training that's too slow",
        "Using too little data",
      ],
      pl: [
        "Model zbyt prosty, by się uczyć",
        "Model, który zapamiętuje dane treningowe i słabo generalizuje",
        "Zbyt wolny trening",
        "Użycie zbyt małej ilości danych",
      ],
    },
    correctIndex: 1,
    explanation: {
      en: "Overfitting means the model fits training noise and performs worse on new, unseen data.",
      pl: "Przeuczenie oznacza dopasowanie do szumu treningowego i słabsze wyniki na nowych danych.",
    },
    xp: XP.intermediate,
  },
  {
    id: "ai-4",
    skillId: "ai",
    difficulty: "intermediate",
    format: "mcq",
    question: {
      en: "In a neural network, the activation function mainly introduces:",
      pl: "W sieci neuronowej funkcja aktywacji wprowadza przede wszystkim:",
    },
    options: {
      en: ["Non-linearity", "More memory", "Labels", "Randomness"],
      pl: ["Nieliniowość", "Więcej pamięci", "Etykiety", "Losowość"],
    },
    correctIndex: 0,
    explanation: {
      en: "Without non-linear activations, stacked layers would collapse into a single linear function.",
      pl: "Bez nieliniowych aktywacji warstwy zredukowałyby się do jednej funkcji liniowej.",
    },
    xp: XP.intermediate,
  },
  {
    id: "ai-5",
    skillId: "ai",
    difficulty: "advanced",
    format: "mcq",
    question: {
      en: "In an LLM, raising the 'temperature' setting tends to:",
      pl: "W LLM zwiększenie parametru „temperatura” zwykle:",
    },
    options: {
      en: [
        "Make output more random and varied",
        "Make output more deterministic",
        "Increase context length",
        "Reduce token cost",
      ],
      pl: [
        "Czyni wyniki bardziej losowymi i zróżnicowanymi",
        "Czyni wyniki bardziej deterministycznymi",
        "Zwiększa długość kontekstu",
        "Obniża koszt tokenów",
      ],
    },
    correctIndex: 0,
    explanation: {
      en: "Higher temperature flattens the probability distribution, producing more diverse (less predictable) tokens.",
      pl: "Wyższa temperatura spłaszcza rozkład prawdopodobieństwa, dając bardziej zróżnicowane (mniej przewidywalne) tokeny.",
    },
    xp: XP.advanced,
  },
  {
    id: "ai-6",
    skillId: "ai",
    difficulty: "advanced",
    format: "mcq",
    question: { en: "What does 'RAG' mean in LLM applications?", pl: "Co oznacza „RAG” w aplikacjach LLM?" },
    options: {
      en: [
        "Retrieval-Augmented Generation",
        "Recurrent Attention Gateway",
        "Random Answer Generator",
        "Ranked Agent Grouping",
      ],
      pl: [
        "Retrieval-Augmented Generation (generacja wspomagana wyszukiwaniem)",
        "Rekurencyjna bramka uwagi",
        "Generator losowych odpowiedzi",
        "Rankingowe grupowanie agentów",
      ],
    },
    correctIndex: 0,
    explanation: {
      en: "RAG retrieves relevant documents and feeds them into the prompt so the model answers from real sources.",
      pl: "RAG wyszukuje istotne dokumenty i dołącza je do promptu, by model odpowiadał na podstawie realnych źródeł.",
    },
    xp: XP.advanced,
  },

  /* ---------------- Generic (used for custom / "Other" skills) ---------------- */
  {
    id: "generic-1",
    skillId: "generic",
    difficulty: "beginner",
    format: "mcq",
    question: { en: "What is 'active recall'?", pl: "Czym jest „aktywne przypominanie”?" },
    options: {
      en: [
        "Re-reading your notes repeatedly",
        "Testing yourself to retrieve information from memory",
        "Highlighting key sentences",
        "Listening passively",
      ],
      pl: [
        "Wielokrotne czytanie notatek",
        "Sprawdzanie siebie przez przypominanie informacji z pamięci",
        "Podkreślanie kluczowych zdań",
        "Bierne słuchanie",
      ],
    },
    correctIndex: 1,
    explanation: {
      en: "Actively retrieving information strengthens memory far more than passive review.",
      pl: "Aktywne przypominanie wzmacnia pamięć znacznie bardziej niż bierne powtarzanie.",
    },
    xp: XP.beginner,
  },
  {
    id: "generic-2",
    skillId: "generic",
    difficulty: "beginner",
    format: "mcq",
    question: { en: "Spaced repetition means reviewing material:", pl: "Powtórki rozłożone w czasie to przeglądanie materiału:" },
    options: {
      en: [
        "All at once before a deadline",
        "At increasing intervals over time",
        "Only when you forget it",
        "Exactly once",
      ],
      pl: [
        "Wszystkiego naraz przed terminem",
        "W rosnących odstępach czasu",
        "Tylko gdy zapomnisz",
        "Dokładnie raz",
      ],
    },
    correctIndex: 1,
    explanation: {
      en: "Reviewing just before you'd forget — at growing intervals — locks information into long-term memory.",
      pl: "Powtarzanie tuż przed zapomnieniem — w rosnących odstępach — utrwala wiedzę w pamięci długotrwałej.",
    },
    xp: XP.beginner,
  },
  {
    id: "generic-3",
    skillId: "generic",
    difficulty: "intermediate",
    format: "mcq",
    question: { en: "The Pomodoro technique uses:", pl: "Technika Pomodoro polega na:" },
    options: {
      en: [
        "One long study marathon",
        "Focused intervals separated by short breaks",
        "Studying only at night",
        "Multitasking across subjects",
      ],
      pl: [
        "Jednym długim maratonie nauki",
        "Skupionych interwałach przedzielonych krótkimi przerwami",
        "Nauce tylko nocą",
        "Wielozadaniowości między przedmiotami",
      ],
    },
    correctIndex: 1,
    explanation: {
      en: "Typically ~25 minutes of focus then a short break, which sustains attention and reduces fatigue.",
      pl: "Zwykle ~25 minut skupienia, potem krótka przerwa — utrzymuje uwagę i zmniejsza zmęczenie.",
    },
    xp: XP.intermediate,
  },
  {
    id: "generic-4",
    skillId: "generic",
    difficulty: "intermediate",
    format: "mcq",
    question: { en: "What is 'interleaving' in practice?", pl: "Czym jest „przeplatanie” w nauce?" },
    options: {
      en: [
        "Mixing different topics or problem types in one session",
        "Doing the same drill repeatedly",
        "Studying with music",
        "Skipping hard problems",
      ],
      pl: [
        "Mieszanie różnych tematów lub typów zadań w jednej sesji",
        "Powtarzanie tego samego ćwiczenia",
        "Nauka z muzyką",
        "Pomijanie trudnych zadań",
      ],
    },
    correctIndex: 0,
    explanation: {
      en: "Interleaving forces you to choose the right approach each time, improving flexible recall.",
      pl: "Przeplatanie zmusza do wyboru właściwego podejścia za każdym razem, co poprawia elastyczne przypominanie.",
    },
    xp: XP.intermediate,
  },
  {
    id: "generic-5",
    skillId: "generic",
    difficulty: "advanced",
    format: "mcq",
    question: { en: "The Feynman technique is about:", pl: "Technika Feynmana polega na:" },
    options: {
      en: [
        "Memorizing definitions word for word",
        "Explaining a concept in simple terms to expose gaps",
        "Reading advanced textbooks only",
        "Avoiding analogies",
      ],
      pl: [
        "Dosłownym zapamiętywaniu definicji",
        "Tłumaczeniu pojęcia prostymi słowami, by ujawnić luki",
        "Czytaniu wyłącznie zaawansowanych podręczników",
        "Unikaniu analogii",
      ],
    },
    correctIndex: 1,
    explanation: {
      en: "If you can teach it simply, you understand it; where you stumble shows what to revisit.",
      pl: "Jeśli potrafisz to prosto wytłumaczyć — rozumiesz; miejsca, gdzie się potykasz, wskazują, co powtórzyć.",
    },
    xp: XP.advanced,
  },
  {
    id: "generic-6",
    skillId: "generic",
    difficulty: "advanced",
    format: "mcq",
    question: { en: "'Deliberate practice' is best described as:", pl: "„Praktyka celowa” to najlepiej:" },
    options: {
      en: [
        "Repeating what you already do well",
        "Targeted practice at the edge of your ability, with feedback",
        "Practicing as long as possible",
        "Watching experts perform",
      ],
      pl: [
        "Powtarzanie tego, co już umiesz",
        "Ukierunkowane ćwiczenie na granicy umiejętności, z informacją zwrotną",
        "Ćwiczenie jak najdłużej",
        "Oglądanie ekspertów",
      ],
    },
    correctIndex: 1,
    explanation: {
      en: "Deliberate practice targets specific weaknesses just beyond your current level and uses feedback to improve.",
      pl: "Praktyka celowa atakuje konkretne słabości tuż powyżej obecnego poziomu i wykorzystuje feedback do poprawy.",
    },
    xp: XP.advanced,
  },
];

/** All items for a skill; custom/unknown skills fall back to the generic bank. */
export function itemsForSkill(skillId: string): QAItem[] {
  const direct = CONTENT.filter((c) => c.skillId === skillId);
  return direct.length > 0 ? direct : CONTENT.filter((c) => c.skillId === "generic");
}

export function getItem(id: string): QAItem | undefined {
  return CONTENT.find((c) => c.id === id);
}
