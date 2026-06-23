/* templates.js - Predefined Video Format & Style Templates database */

const templates = {
  'ugc': {
    title: 'UGC (User Generated Content) Product Review',
    instructions: 'You must structure the storyboard as a UGC product review: Scene 1: Product Hero Shot & Hook. Scene 2: Unboxing/revealing the product. Scene 3: Close-up of texture/dropper/application of the product on skin or hands. Scene 4: Spreading/using the product showing detailed action. Scene 5: Final results/Call-to-Action with a smiling presenter showing the product.',
    scenes: [
      {
        title: 'Product Hero Shot',
        image_prompt: 'A premium glass face serum bottle with dropper, placed on a wet stone surface with water splashes and green leaves. Luxury skincare photography.',
        video_prompt: 'skincare serum bottle on a wet stone, camera panning upward with light reflecting on the glass bottle.'
      },
      {
        title: 'Unboxing and Texture',
        image_prompt: 'Hands unboxing the serum from a pastel cardboard box. Soft aesthetic lighting, clean hands, neutral nails.',
        video_prompt: 'unboxing the serum bottle, opening the lid, and slowly pulling out the dropper.'
      },
      {
        title: 'Applying Dropper on Skin',
        image_prompt: 'Close-up of a glass dropper releasing a single glossy drop of clear serum onto a clean cheek. Professional beauty photography.',
        video_prompt: 'dropper releasing a drop of serum, serum sliding down smooth glowing skin.'
      },
      {
        title: 'Spreading and Absorption',
        image_prompt: 'Hands gently massaging and spreading the serum across facial skin, creating a glowing dewiness. Soft focus beauty shot.',
        video_prompt: 'fingers spreading the serum in circular motions, skin absorbing the liquid, revealing a glossy finish.'
      },
      {
        title: 'Before After Split Result',
        image_prompt: 'Split screen showing dull dry skin on the left, and deeply hydrated glowing glass skin on the right. Studio beauty portrait.',
        video_prompt: 'transition from dry skin to glowing skin, smiling confidently.'
      }
    ]
  },
  'timelapse': {
    title: 'Timelapse (Rakit / Assembly)',
    instructions: 'You must structure the storyboard as a timelapse build: Scene 1: Finished model/showcase. Scene 2: Sorting parts/raw elements on the table. Scene 3: Base foundation assembly. Scene 4: Intermediate assembly steps showing layers stacking rapidly (timelapse effect). Scene 5: Final touch/attaching accessories and rotating turntable display of the finished model.',
    scenes: [
      {
        title: 'Finished Supercar Model',
        image_prompt: 'A close-up shot of a completed miniature supercar model made of cardboard on a wooden workbench, detailing headlights, carbon texture, and spoilers. Product photography, dark background.',
        video_prompt: 'completed miniature cardboard supercar on the workbench, camera slowly rotating around it to highlight details.'
      },
      {
        title: 'Raw Cardboard Materials',
        image_prompt: 'A flat lay of raw brown cardboard sheets, utility knife, steel ruler, and glue bottle on a green cutting mat. Industrial layout photography.',
        video_prompt: 'camera panning across cardboard sheets and crafting tools arranged on a workbench.'
      },
      {
        title: 'Cutting and Scribing Parts',
        image_prompt: 'A close-up of hands using a utility knife to cut complex wheel arch panels out of a cardboard sheet. Precision crafting photography.',
        video_prompt: 'hands carefully cutting cardboard panels, small cardboard shavings scatter on the mat.'
      },
      {
        title: 'Assembling the Chassis',
        image_prompt: 'Assembling the base chassis of the cardboard car using hot glue, structural frames visible. Symmetrical workbench shot.',
        video_prompt: 'hands gluing structural pillars to the chassis, hot glue gun smoking slightly.'
      },
      {
        title: 'Attaching the Outer Body shell',
        image_prompt: 'Fitting the curved hood and spoiler panels onto the car body, revealing the supercar silhouette. Action crafting photography.',
        video_prompt: 'outer body panels being pressed onto the chassis, fitting perfectly into place.'
      }
    ]
  },
  'crafting': {
    title: 'Kerajinan / DIY Tutorial',
    instructions: 'You must structure the storyboard as a DIY crafting tutorial: Scene 1: Finished glazed/polished product. Scene 2: Slicing/measuring/preparing raw materials. Scene 3: Shaping/assembling/punching holes. Scene 4: Precision handcrafting actions (stitching, pouring, sanding). Scene 5: Finishing coat/burnishing and final beauty shot.',
    scenes: [
      {
        title: 'Finished Leather Wallet',
        image_prompt: 'A completed bifold brown leather wallet with clean cream stitching, placed on a dark leather hide. Luxury leathercraft.',
        video_prompt: 'completed leather bifold wallet on a desk, camera zooming in on the polished edges and stitching.'
      },
      {
        title: 'Cutting the Pattern',
        image_prompt: 'Hands using a rotary cutter to cut patterns out of a thick full-grain vegetable-tanned leather hide. Workbench view.',
        video_prompt: 'rotary cutter slicing through thick brown leather, leaving clean edges.'
      },
      {
        title: 'Punching Stitching Holes',
        image_prompt: 'Striking a pricking iron chisel with a mallet to punch holes in the leather edges. Close-up action shot.',
        video_prompt: 'mallet hitting the pricking iron, punching clean stitching holes along the leather border.'
      },
      {
        title: 'Saddle Stitching by Hand',
        image_prompt: 'Two needles with waxed thread crossing through a single hole in a wooden stitching pony. Focus on hands.',
        video_prompt: 'hands saddle-stitching leather pieces together using two needles and cream waxed thread.'
      },
      {
        title: 'Sanding and Burnishing Edges',
        image_prompt: 'Fingers rubbing a wooden slicker along the edge of the leather wallet with tokonole, creating a glassy shine.',
        video_prompt: 'wooden slicker rubbing the wallet edges rapidly, creating a smooth glossy burnished edge.'
      }
    ]
  },
  'cinematic': {
    title: 'Cinematic Vlog / Promo',
    instructions: 'You must structure the storyboard as a high-end cinematic vlog/promo: Scene 1: Finished hero item close-up with steam/particles and dramatic lighting. Scene 2: Detailed slow-motion action of prep work (extraction, grinding, cutting). Scene 3: Detailed slow-motion action of intermediate step (frothing, mixing, pouring). Scene 4: Precision close-up of drawing the art/details. Scene 5: Epic rotating/sliding beauty shot of the completed item in a cozy or luxurious environment.',
    scenes: [
      {
        title: 'Finished Swan Latte',
        image_prompt: 'A finished cup of coffee with a perfect white swan latte art design in a dark ceramic mug, on a wooden coffee bar. Warm lighting, steam rising.',
        video_prompt: 'swan latte art coffee cup, camera zooming out slowly to show steam rising.'
      },
      {
        title: 'Espresso Extraction',
        image_prompt: 'Vibrant golden-brown espresso liquid pulling from a portafilter spout into a cup, rich crema forming. Macro bar shot, shallow depth of field.',
        video_prompt: 'creamy espresso liquid extracting from espresso machine into coffee cup.'
      },
      {
        title: 'Frothing the Milk',
        image_prompt: 'A steel milk pitcher under a steam wand, creating microfoam milk. Sizzling steam visible, cinematic backlight.',
        video_prompt: 'steam wand frothing milk in pitcher, milk swirling and creating smooth microfoam.'
      },
      {
        title: 'Starting the Pour',
        image_prompt: 'Pouring steamed milk from a height into the espresso cup, mixing to create a brown base. Barista action close-up.',
        video_prompt: 'barista pouring milk into espresso, tilting cup to mix the milk and coffee.'
      },
      {
        title: 'Drawing the Swan',
        image_prompt: 'Barista brings pitcher spout close, wiggling to form wing feathers and pulling back to draw the swan neck. Epic detail shot.',
        video_prompt: 'steamed milk drawing wing and neck of the swan, final lift to cut the pattern.'
      }
    ]
  },
  'travel': {
    title: 'Travel Vlog / Packing',
    instructions: 'You must structure the storyboard as a travel/packing vlog: Scene 1: Packed backpack/gear ready for adventure. Scene 2: Flat lay of sorted travel clothes and gear. Scene 3: Packing main compartment step-by-step. Scene 4: Organizing tech items/cables into pouches. Scene 5: Zipping up backpack, pulling straps tight, and wearing it.',
    scenes: [
      {
        title: 'Packed Backpack Ready',
        image_prompt: 'A green travel backpack packed tightly, sitting next to a passport and sunglasses on a wooden bench. Adventure theme, warm travel lighting.',
        video_prompt: 'travel backpack on a bench, camera panning out to show a passport, map, and sunglasses.'
      },
      {
        title: 'Sorting Travel Gear',
        image_prompt: 'A flat lay of travel clothes in packing cubes, a camera, travel bottle kit, and charger cables. Structured layout on floor.',
        video_prompt: 'arranging gear cubes on the floor, organizing travel items.'
      },
      {
        title: 'Packing the Main Compartment',
        image_prompt: 'Hands sliding packing cubes and camera case inside the main compartment of the backpack. Clean overhead view.',
        video_prompt: 'hands packing cubes into the bottom, sliding heavy gear next to the back padding.'
      },
      {
        title: 'Organizing Tech Pouch',
        image_prompt: 'Placing power bank, cables, and SSD drive into a tech organizer pouch, zipping it up. Close-up action.',
        video_prompt: 'inserting cables into mesh pockets, folding the organizer pouch, and zipping it.'
      },
      {
        title: 'Zipping and Wearing',
        image_prompt: 'Zipping the outer pockets of the backpack and pulling the compression straps tight. Action travel shot.',
        video_prompt: 'zipping the backpack, pulling straps tight, person lifting it onto their shoulders.'
      }
    ]
  },
  'hobby': {
    title: 'Hobbyist Showcase (Arts & Crafts)',
    instructions: 'You must structure the storyboard as a hobby showcase: Scene 1: Finished masterpiece close-up. Scene 2: Preparing base/paper/acrylic cups. Scene 3: Applying base coats/initial folds. Scene 4: Applying shadow washes/detailed accent folds/tilting colors. Scene 5: Final highlights/unfolding and display spin.',
    scenes: [
      {
        title: 'Finished Miniature Model',
        image_prompt: 'A highly detailed painted fantasy warrior miniature model on a grass base, holding a glowing sword. Macro photography, dark background.',
        video_prompt: 'completed painted miniature model, camera rotating to show all painted angles.'
      },
      {
        title: 'Applying Primer Coat',
        image_prompt: 'Spraying black matte primer onto a grey plastic miniature model on a rotating stand. Airbrush studio shot.',
        video_prompt: 'airbrush coating the grey plastic miniature with black primer, spinning the stand.'
      },
      {
        title: 'Basecoating the Armor',
        image_prompt: 'Using a fine detail brush to apply metallic blue paint to the chest armor plate of the miniature. Zoomed macro view.',
        video_prompt: 'precision brush painting blue armor highlights on the tiny figure.'
      },
      {
        title: 'Applying Wash Shadow',
        image_prompt: 'Brushing dark acrylic wash shadow into the armor recesses, adding depth and shadow. Macro action shot.',
        video_prompt: 'dark wash flowing into the cracks and recesses of the miniature armor, shading it.'
      },
      {
        title: 'Drybrushing Highlights',
        image_prompt: 'Lightly brushing silver paint highlights onto the raised armor edges, finalizing details. Studio workspace view.',
        video_prompt: 'brush drybrushing silver highlights onto the sword and shield edges, making them pop.'
      }
    ]
  }
};

// Global prompt generators helper functions
function generateGridPrompt(title, scenes) {
  const listStr = scenes.map((s, idx) => `${idx + 1}. ${s.title}`).join(', ');
  return `Create a vertical storyboard grid image exactly like a video tutorial infographic. The image should contain a grid layout of ${scenes.length} sequential vertical panels (organized in rows). Each panel must depict a step of "${title}": ${listStr}. On the top-left of each panel, overlay the yellow bold text "SCENE X" (where X is 1 to ${scenes.length}). On the top-right, overlay white text of timestamps like "0-2s", "2-4s", etc. Directly below each panel image, draw a solid black footer containing a bold yellow/gold title in Indonesian and a short description in white text in Indonesian. Separate all panels with a clean thin white border line. The background of the entire image is dark. Professional product photography style, high-quality.`;
}

function generateSeedancePrompt(title, scenes) {
  let intro = `IMPORTANT: The input is a storyboard grid with borders, black footers, and text overlays. For the generated video, you MUST completely crop out all grid lines, borders, black footers, and text overlays. Zoom in to show only the action in clean full screen. At the very beginning (0-2s), start directly with a clean, full-screen cinematic shot of the finished product, with absolutely no text or borders visible.\n`;
  const scenesStr = scenes.map((s, idx) => {
    if (idx === 0) return `- Scene 1 (0-2s): Start with a cinematic shot of ${s.video_prompt}`;
    return `- Scene ${idx + 1}: ${s.video_prompt}`;
  }).join('\n');
  return intro + scenesStr;
}
