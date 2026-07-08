export interface MemoryVerse {
  id: string;
  ref: string;
  bookSlug: string;
  bookId: number;
  chapter: number;
  verse: number;
  /** KJV text, plain */
  text: string;
}

export interface MemoryPack {
  id: string;
  name: string;
  description: string;
  verses: MemoryVerse[];
}

export const MEMORY_PACKS: MemoryPack[] = [
  {
    id: "gospel-core",
    name: "The Gospel Core",
    description: "Eight verses that walk through the good news from sin to salvation — the classic 'Romans Road' and beyond.",
    verses: [
      { id: "rom-3-23", ref: "Romans 3:23", bookSlug: "romans", bookId: 45, chapter: 3, verse: 23, text: "For all have sinned, and come short of the glory of God;" },
      { id: "rom-6-23", ref: "Romans 6:23", bookSlug: "romans", bookId: 45, chapter: 6, verse: 23, text: "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord." },
      { id: "rom-5-8", ref: "Romans 5:8", bookSlug: "romans", bookId: 45, chapter: 5, verse: 8, text: "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us." },
      { id: "john-3-16", ref: "John 3:16", bookSlug: "john", bookId: 43, chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
      { id: "rom-10-9", ref: "Romans 10:9", bookSlug: "romans", bookId: 45, chapter: 10, verse: 9, text: "That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved." },
      { id: "eph-2-8", ref: "Ephesians 2:8", bookSlug: "ephesians", bookId: 49, chapter: 2, verse: 8, text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:" },
      { id: "john-14-6", ref: "John 14:6", bookSlug: "john", bookId: 43, chapter: 14, verse: 6, text: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me." },
      { id: "2cor-5-17", ref: "2 Corinthians 5:17", bookSlug: "2-corinthians", bookId: 47, chapter: 5, verse: 17, text: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new." },
    ],
  },
  {
    id: "anxiety-peace",
    name: "Peace over Anxiety",
    description: "Verses to hide in your heart for anxious days.",
    verses: [
      { id: "phil-4-6", ref: "Philippians 4:6", bookSlug: "philippians", bookId: 50, chapter: 4, verse: 6, text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God." },
      { id: "phil-4-7", ref: "Philippians 4:7", bookSlug: "philippians", bookId: 50, chapter: 4, verse: 7, text: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus." },
      { id: "1pet-5-7", ref: "1 Peter 5:7", bookSlug: "1-peter", bookId: 60, chapter: 5, verse: 7, text: "Casting all your care upon him; for he careth for you." },
      { id: "isa-41-10", ref: "Isaiah 41:10", bookSlug: "isaiah", bookId: 23, chapter: 41, verse: 10, text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness." },
      { id: "john-16-33", ref: "John 16:33", bookSlug: "john", bookId: 43, chapter: 16, verse: 33, text: "These things I have spoken unto you, that in me ye might have peace. In the world ye shall have tribulation: but be of good cheer; I have overcome the world." },
      { id: "ps-46-1", ref: "Psalm 46:1", bookSlug: "psalms", bookId: 19, chapter: 46, verse: 1, text: "God is our refuge and strength, a very present help in trouble." },
      { id: "matt-11-28", ref: "Matthew 11:28", bookSlug: "matthew", bookId: 40, chapter: 11, verse: 28, text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest." },
    ],
  },
  {
    id: "wisdom-guidance",
    name: "Wisdom & Guidance",
    description: "Anchors for decisions, direction, and daily walking with God.",
    verses: [
      { id: "prov-3-5", ref: "Proverbs 3:5", bookSlug: "proverbs", bookId: 20, chapter: 3, verse: 5, text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
      { id: "prov-3-6", ref: "Proverbs 3:6", bookSlug: "proverbs", bookId: 20, chapter: 3, verse: 6, text: "In all thy ways acknowledge him, and he shall direct thy paths." },
      { id: "ps-119-105", ref: "Psalm 119:105", bookSlug: "psalms", bookId: 19, chapter: 119, verse: 105, text: "Thy word is a lamp unto my feet, and a light unto my path." },
      { id: "jas-1-5", ref: "James 1:5", bookSlug: "james", bookId: 59, chapter: 1, verse: 5, text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him." },
      { id: "ps-37-4", ref: "Psalm 37:4", bookSlug: "psalms", bookId: 19, chapter: 37, verse: 4, text: "Delight thyself also in the LORD; and he shall give thee the desires of thine heart." },
      { id: "rom-12-2", ref: "Romans 12:2", bookSlug: "romans", bookId: 45, chapter: 12, verse: 2, text: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God." },
    ],
  },
  {
    id: "courage-strength",
    name: "Courage & Strength",
    description: "For seasons that demand bravery and endurance.",
    verses: [
      { id: "josh-1-9", ref: "Joshua 1:9", bookSlug: "joshua", bookId: 6, chapter: 1, verse: 9, text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest." },
      { id: "isa-40-31", ref: "Isaiah 40:31", bookSlug: "isaiah", bookId: 23, chapter: 40, verse: 31, text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint." },
      { id: "phil-4-13", ref: "Philippians 4:13", bookSlug: "philippians", bookId: 50, chapter: 4, verse: 13, text: "I can do all things through Christ which strengtheneth me." },
      { id: "deut-31-6", ref: "Deuteronomy 31:6", bookSlug: "deuteronomy", bookId: 5, chapter: 31, verse: 6, text: "Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee." },
      { id: "2tim-1-7", ref: "2 Timothy 1:7", bookSlug: "2-timothy", bookId: 55, chapter: 1, verse: 7, text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind." },
      { id: "ps-27-1", ref: "Psalm 27:1", bookSlug: "psalms", bookId: 19, chapter: 27, verse: 1, text: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?" },
    ],
  },
];

export function getMemoryPack(id: string): MemoryPack | undefined {
  return MEMORY_PACKS.find((p) => p.id === id);
}
