/**
 * NON-DESTRUCTIVE seed script: Seeds the complete NCERT rationalized syllabus
 * for Classes XI and XII across Physics, Chemistry, Biology, and Mathematics.
 * 
 * This script is ADDITIVE-ONLY:
 * - Creates subjects only if they don't already exist
 * - Creates chapters only if they don't already exist (checked by name + class + subjectId)
 * - Creates standard batches only if they don't already exist
 * - NEVER calls deleteMany() or removes any existing data
 * 
 * Safe to run multiple times — idempotent.
 * 
 * Source: NCERT Rationalized Syllabus 2025-26 (verified against ncert.nic.in)
 */

import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { Subject } from '../models/Subject';
import { Chapter } from '../models/Chapter';
import { Batch } from '../models/Batch';

dotenv.config();

// ============================================================================
// NCERT RATIONALIZED CHAPTER DATA (2025-26)
// Verified against ncert.nic.in and official CBSE curriculum documents
// ============================================================================

interface ChapterEntry {
  name: string;
  order: number;
}

interface SubjectChapters {
  XI: ChapterEntry[];
  XII: ChapterEntry[];
}

const NCERT_SYLLABUS: Record<string, SubjectChapters> = {
  // ──────────────────────────────────────────────────────
  // PHYSICS — 14 chapters each for XI and XII
  // ──────────────────────────────────────────────────────
  Physics: {
    XI: [
      { name: 'Units and Measurements', order: 1 },
      { name: 'Motion in a Straight Line', order: 2 },
      { name: 'Motion in a Plane', order: 3 },
      { name: 'Laws of Motion', order: 4 },
      { name: 'Work, Energy and Power', order: 5 },
      { name: 'System of Particles and Rotational Motion', order: 6 },
      { name: 'Gravitation', order: 7 },
      { name: 'Mechanical Properties of Solids', order: 8 },
      { name: 'Mechanical Properties of Fluids', order: 9 },
      { name: 'Thermal Properties of Matter', order: 10 },
      { name: 'Thermodynamics', order: 11 },
      { name: 'Kinetic Theory', order: 12 },
      { name: 'Oscillations', order: 13 },
      { name: 'Waves', order: 14 },
    ],
    XII: [
      { name: 'Electric Charges and Fields', order: 1 },
      { name: 'Electrostatic Potential and Capacitance', order: 2 },
      { name: 'Current Electricity', order: 3 },
      { name: 'Moving Charges and Magnetism', order: 4 },
      { name: 'Magnetism and Matter', order: 5 },
      { name: 'Electromagnetic Induction', order: 6 },
      { name: 'Alternating Current', order: 7 },
      { name: 'Electromagnetic Waves', order: 8 },
      { name: 'Ray Optics and Optical Instruments', order: 9 },
      { name: 'Wave Optics', order: 10 },
      { name: 'Dual Nature of Radiation and Matter', order: 11 },
      { name: 'Atoms', order: 12 },
      { name: 'Nuclei', order: 13 },
      { name: 'Semiconductor Electronics: Materials, Devices and Simple Circuits', order: 14 },
    ],
  },

  // ──────────────────────────────────────────────────────
  // CHEMISTRY — 9 chapters for XI, 10 chapters for XII
  // ──────────────────────────────────────────────────────
  Chemistry: {
    XI: [
      { name: 'Some Basic Concepts of Chemistry', order: 1 },
      { name: 'Structure of Atom', order: 2 },
      { name: 'Classification of Elements and Periodicity in Properties', order: 3 },
      { name: 'Chemical Bonding and Molecular Structure', order: 4 },
      { name: 'Chemical Thermodynamics', order: 5 },
      { name: 'Equilibrium', order: 6 },
      { name: 'Redox Reactions', order: 7 },
      { name: 'Organic Chemistry – Some Basic Principles and Techniques', order: 8 },
      { name: 'Hydrocarbons', order: 9 },
    ],
    XII: [
      { name: 'Solutions', order: 1 },
      { name: 'Electrochemistry', order: 2 },
      { name: 'Chemical Kinetics', order: 3 },
      { name: 'The d- and f-Block Elements', order: 4 },
      { name: 'Coordination Compounds', order: 5 },
      { name: 'Haloalkanes and Haloarenes', order: 6 },
      { name: 'Alcohols, Phenols and Ethers', order: 7 },
      { name: 'Aldehydes, Ketones and Carboxylic Acids', order: 8 },
      { name: 'Amines', order: 9 },
      { name: 'Biomolecules', order: 10 },
    ],
  },

  // ──────────────────────────────────────────────────────
  // BIOLOGY — 19 chapters for XI, 13 chapters for XII
  // ──────────────────────────────────────────────────────
  Biology: {
    XI: [
      { name: 'The Living World', order: 1 },
      { name: 'Biological Classification', order: 2 },
      { name: 'Plant Kingdom', order: 3 },
      { name: 'Animal Kingdom', order: 4 },
      { name: 'Morphology of Flowering Plants', order: 5 },
      { name: 'Anatomy of Flowering Plants', order: 6 },
      { name: 'Structural Organisation in Animals', order: 7 },
      { name: 'Cell: The Unit of Life', order: 8 },
      { name: 'Biomolecules', order: 9 },
      { name: 'Cell Cycle and Cell Division', order: 10 },
      { name: 'Photosynthesis in Higher Plants', order: 11 },
      { name: 'Respiration in Plants', order: 12 },
      { name: 'Plant Growth and Development', order: 13 },
      { name: 'Breathing and Exchange of Gases', order: 14 },
      { name: 'Body Fluids and Circulation', order: 15 },
      { name: 'Excretory Products and their Elimination', order: 16 },
      { name: 'Locomotion and Movement', order: 17 },
      { name: 'Neural Control and Coordination', order: 18 },
      { name: 'Chemical Coordination and Integration', order: 19 },
    ],
    XII: [
      { name: 'Sexual Reproduction in Flowering Plants', order: 1 },
      { name: 'Human Reproduction', order: 2 },
      { name: 'Reproductive Health', order: 3 },
      { name: 'Principles of Inheritance and Variation', order: 4 },
      { name: 'Molecular Basis of Inheritance', order: 5 },
      { name: 'Evolution', order: 6 },
      { name: 'Human Health and Disease', order: 7 },
      { name: 'Microbes in Human Welfare', order: 8 },
      { name: 'Biotechnology: Principles and Processes', order: 9 },
      { name: 'Biotechnology and its Applications', order: 10 },
      { name: 'Organisms and Populations', order: 11 },
      { name: 'Ecosystem', order: 12 },
      { name: 'Biodiversity and Conservation', order: 13 },
    ],
  },

  // ──────────────────────────────────────────────────────
  // MATHEMATICS — 14 chapters for XI, 13 chapters for XII
  // ──────────────────────────────────────────────────────
  Mathematics: {
    XI: [
      { name: 'Sets', order: 1 },
      { name: 'Relations and Functions', order: 2 },
      { name: 'Trigonometric Functions', order: 3 },
      { name: 'Complex Numbers and Quadratic Equations', order: 4 },
      { name: 'Linear Inequalities', order: 5 },
      { name: 'Permutations and Combinations', order: 6 },
      { name: 'Binomial Theorem', order: 7 },
      { name: 'Sequences and Series', order: 8 },
      { name: 'Straight Lines', order: 9 },
      { name: 'Conic Sections', order: 10 },
      { name: 'Introduction to Three-dimensional Geometry', order: 11 },
      { name: 'Limits and Derivatives', order: 12 },
      { name: 'Statistics', order: 13 },
      { name: 'Probability', order: 14 },
    ],
    XII: [
      { name: 'Relations and Functions', order: 1 },
      { name: 'Inverse Trigonometric Functions', order: 2 },
      { name: 'Matrices', order: 3 },
      { name: 'Determinants', order: 4 },
      { name: 'Continuity and Differentiability', order: 5 },
      { name: 'Application of Derivatives', order: 6 },
      { name: 'Integrals', order: 7 },
      { name: 'Application of Integrals', order: 8 },
      { name: 'Differential Equations', order: 9 },
      { name: 'Vector Algebra', order: 10 },
      { name: 'Three Dimensional Geometry', order: 11 },
      { name: 'Linear Programming', order: 12 },
      { name: 'Probability', order: 13 },
    ],
  },
};

// ============================================================================
// STANDARD BATCHES
// ============================================================================

const STANDARD_BATCHES = [
  { name: 'Class XI NEET Batch', class: 'XI' as const, stream: 'NEET' as const },
  { name: 'Class XI JEE Batch', class: 'XI' as const, stream: 'JEE' as const },
  { name: 'Class XI Foundation Batch', class: 'XI' as const, stream: 'Foundation' as const },
  { name: 'Class XII NEET Batch', class: 'XII' as const, stream: 'NEET' as const },
  { name: 'Class XII JEE Batch', class: 'XII' as const, stream: 'JEE' as const },
  { name: 'Class XII Foundation Batch', class: 'XII' as const, stream: 'Foundation' as const },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedNCERTSyllabus() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  📚 NCERT Rationalized Syllabus Seeder (2025-26)           ║');
  console.log('║  NON-DESTRUCTIVE — Additive only, safe to re-run           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  await connectDB();

  // ── Step 1: Seed Subjects ─────────────────────────────
  console.log('── Step 1: Subjects ──');
  const subjectMap: Record<string, any> = {};
  const subjectDefinitions = [
    { name: 'Physics', applicableStreams: ['JEE', 'NEET', 'Foundation'] },
    { name: 'Chemistry', applicableStreams: ['JEE', 'NEET', 'Foundation'] },
    { name: 'Biology', applicableStreams: ['NEET', 'Foundation'] },
    { name: 'Mathematics', applicableStreams: ['JEE', 'Foundation'] },
  ];

  for (const s of subjectDefinitions) {
    let subject = await Subject.findOne({ name: s.name });
    if (!subject) {
      subject = await Subject.create(s);
      console.log(`  ✅ Created subject: ${s.name}`);
    } else {
      console.log(`  ⏭️  Subject '${s.name}' already exists.`);
    }
    subjectMap[s.name] = subject;
  }

  // ── Step 2: Seed Chapters ─────────────────────────────
  console.log('\n── Step 2: Chapters ──');
  let created = 0;
  let skipped = 0;

  for (const [subjectName, classChapters] of Object.entries(NCERT_SYLLABUS)) {
    const subject = subjectMap[subjectName];
    if (!subject) {
      console.error(`  ❌ Subject '${subjectName}' not found — skipping`);
      continue;
    }

    for (const classLevel of ['XI', 'XII'] as const) {
      const chapters = classChapters[classLevel];
      console.log(`\n  📖 ${subjectName} — Class ${classLevel} (${chapters.length} chapters):`);

      for (const ch of chapters) {
        const existing = await Chapter.findOne({
          subjectId: subject._id,
          class: classLevel,
          name: ch.name,
        });

        if (!existing) {
          await Chapter.create({
            subjectId: subject._id,
            class: classLevel,
            name: ch.name,
            order: ch.order,
          });
          console.log(`    ✅ Ch ${ch.order}: ${ch.name}`);
          created++;
        } else {
          console.log(`    ⏭️  Ch ${ch.order}: ${ch.name} (exists)`);
          skipped++;
        }
      }
    }
  }

  console.log(`\n  📊 Chapters: ${created} created, ${skipped} already existed.`);

  // ── Step 3: Seed Standard Batches ─────────────────────
  console.log('\n── Step 3: Standard Batches ──');
  for (const b of STANDARD_BATCHES) {
    const existing = await Batch.findOne({ name: b.name });
    if (!existing) {
      await Batch.create(b);
      console.log(`  ✅ Created batch: ${b.name}`);
    } else {
      console.log(`  ⏭️  Batch '${b.name}' already exists.`);
    }
  }

  // ── Summary ───────────────────────────────────────────
  const totalSubjects = await Subject.countDocuments();
  const totalChapters = await Chapter.countDocuments();
  const totalBatches = await Batch.countDocuments();

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  ✅ Seeding complete!                                       ║`);
  console.log(`║  Subjects: ${String(totalSubjects).padEnd(3)} | Chapters: ${String(totalChapters).padEnd(4)}| Batches: ${String(totalBatches).padEnd(3)}      ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
}

// ============================================================================
// RUN
// ============================================================================

seedNCERTSyllabus()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
