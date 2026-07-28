import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { Subject } from '../models/Subject';
import { Chapter } from '../models/Chapter';
import { seedSubjects } from './seedSubjects';

dotenv.config();

export async function seedChapters() {
  await connectDB();
  await seedSubjects();

  const physics = await Subject.findOne({ name: 'Physics' });
  const chemistry = await Subject.findOne({ name: 'Chemistry' });
  const biology = await Subject.findOne({ name: 'Biology' });
  const mathematics = await Subject.findOne({ name: 'Mathematics' });

  const starterChapters = [
    // --- Physics XI ---
    { subjectId: physics?._id, class: 'XI', name: 'Physical World & Measurement', order: 1 },
    { subjectId: physics?._id, class: 'XI', name: 'Kinematics', order: 2 },
    { subjectId: physics?._id, class: 'XI', name: 'Laws of Motion', order: 3 },
    { subjectId: physics?._id, class: 'XI', name: 'Work, Energy & Power', order: 4 },
    { subjectId: physics?._id, class: 'XI', name: 'Gravitation', order: 5 },

    // --- Physics XII ---
    { subjectId: physics?._id, class: 'XII', name: 'Electrostatics', order: 1 },
    { subjectId: physics?._id, class: 'XII', name: 'Current Electricity', order: 2 },
    { subjectId: physics?._id, class: 'XII', name: 'Magnetic Effects of Current & Magnetism', order: 3 },
    { subjectId: physics?._id, class: 'XII', name: 'Optics & Wave Optics', order: 4 },

    // --- Chemistry XI ---
    { subjectId: chemistry?._id, class: 'XI', name: 'Some Basic Concepts of Chemistry', order: 1 },
    { subjectId: chemistry?._id, class: 'XI', name: 'Structure of Atom', order: 2 },
    { subjectId: chemistry?._id, class: 'XI', name: 'Chemical Bonding & Molecular Structure', order: 3 },
    { subjectId: chemistry?._id, class: 'XI', name: 'Thermodynamics', order: 4 },

    // --- Chemistry XII ---
    { subjectId: chemistry?._id, class: 'XII', name: 'Solutions', order: 1 },
    { subjectId: chemistry?._id, class: 'XII', name: 'Electrochemistry', order: 2 },
    { subjectId: chemistry?._id, class: 'XII', name: 'Chemical Kinetics', order: 3 },
    { subjectId: chemistry?._id, class: 'XII', name: 'Organic Chemistry: Haloalkanes & Haloarenes', order: 4 },

    // --- Mathematics XI ---
    { subjectId: mathematics?._id, class: 'XI', name: 'Sets & Functions', order: 1 },
    { subjectId: mathematics?._id, class: 'XI', name: 'Trigonometric Functions', order: 2 },
    { subjectId: mathematics?._id, class: 'XI', name: 'Complex Numbers & Quadratic Equations', order: 3 },
    { subjectId: mathematics?._id, class: 'XI', name: 'Limits & Derivatives', order: 4 },

    // --- Mathematics XII ---
    { subjectId: mathematics?._id, class: 'XII', name: 'Relations & Functions', order: 1 },
    { subjectId: mathematics?._id, class: 'XII', name: 'Matrices & Determinants', order: 2 },
    { subjectId: mathematics?._id, class: 'XII', name: 'Integrals & Differential Equations', order: 3 },
    { subjectId: mathematics?._id, class: 'XII', name: 'Vector Algebra & 3D Geometry', order: 4 },

    // --- Biology XI ---
    { subjectId: biology?._id, class: 'XI', name: 'The Living World', order: 1 },
    { subjectId: biology?._id, class: 'XI', name: 'Biological Classification', order: 2 },
    { subjectId: biology?._id, class: 'XI', name: 'Cell: The Unit of Life', order: 3 },
    { subjectId: biology?._id, class: 'XI', name: 'Plant Physiology', order: 4 },

    // --- Biology XII ---
    { subjectId: biology?._id, class: 'XII', name: 'Reproduction in Organisms', order: 1 },
    { subjectId: biology?._id, class: 'XII', name: 'Genetics & Evolution', order: 2 },
    { subjectId: biology?._id, class: 'XII', name: 'Biology & Human Welfare', order: 3 },
    { subjectId: biology?._id, class: 'XII', name: 'Biotechnology & Its Applications', order: 4 },
  ];

  let seededCount = 0;
  for (const item of starterChapters) {
    if (!item.subjectId) continue;
    const existing = await Chapter.findOne({ subjectId: item.subjectId, class: item.class, name: item.name });
    if (!existing) {
      await Chapter.create(item);
      seededCount++;
    }
  }

  console.log(`✓ Seeded ${seededCount} starter chapters into Atlas.`);
}

if (require.main === module) {
  seedChapters().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
