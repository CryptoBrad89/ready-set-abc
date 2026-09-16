/* Ready Set ABC service worker.
   Precaches the whole shell — no lazy caching, no unresolvable spinners.
   The teacher's "Set up this device" button drives a re-cache with progress
   over a MessageChannel. Updates never happen mid-session: a newer worker
   installs, then waits. Only Grown-Ups → Device → Get update sends
   SKIP_WAITING, so the pin never swaps under a child mid-round. */

const VERSION = 'rsabc-shell-v43-voice-clips';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/tokens.css',
  'css/shell.css',
  'css/play.css',
  'css/skins.css',
  'css/grownups.css',
  'css/print.css',
  'js/app.js',
  'js/ui.js',
  'js/store.js',
  'js/data.js',
  'js/csv.js',
  'js/audio.js',
  'js/art.js',
  'js/lucy.js',
  'js/round.js',
  'js/bonus.js',
  'js/closet.js',
  'js/clouds.js',
  'js/profile.js',
  'js/motion.js',
  'js/version.js',
  'js/screens/home.js',
  'js/screens/faces.js',
  'js/screens/match.js',
  'js/screens/bonus.js',
  'js/screens/celebrate.js',
  'js/screens/stage.js',
  'js/screens/trail.js',
  'js/screens/pouch.js',
  'js/screens/stories.js',
  'js/screens/rhymes.js',
  'js/screens/color.js',
  'js/screens/arcade.js',
  'js/screens/coming.js',
  'js/screens/grownups.js',
  'js/screens/printables.js',
  'data/roster.json',
  'data/letters.json',
  'data/audio.json',
  'data/clouds.json',
  'vendor/lottie.min.js',
  'vendor/confetti.min.js',
  'lottie/loader.json',
  'lottie/sparkle.json',
  'lottie/check.json',
  'art/stage/workshop.png',
  'art/words/p-pan.png',
  'art/words/p-panda.png',
  'art/lucy/lucy-default.jpg',
  'art/lucy/lucy-bows.jpg',
  'art/lucy/lucy-clip.jpg',
  'art/lucy/lucy-bows-cutout.jpg',
  'art/lucy/lucy-clip-cutout.jpg',
  'art/lucy/lucy-cutout.jpg',
  'art/lucy/lucy-cap.jpg',
  'art/lucy/lucy-specs.jpg',
  'art/lucy/lucy-bone.jpg',
  'art/lucy/lucy-pack.jpg',
  'art/lucy/lucy-rainbow.jpg',
  'art/lucy/lucy-celebrate.jpg',
  'art/lucy/idle-wave.mp4',
  'art/lucy/idle-blink.mp4',
  'art/lucy/idle-tail.mp4',
  'art/lucy/layer-bows.png',
  'art/lucy/layer-headband.png',
  'art/lucy/layer-clip.png',
  'audio/sfx-tap.wav',
  'audio/sfx-select.wav',
  'audio/sfx-right.wav',
  'audio/sfx-cheer.wav',
  'audio/sfx-wrong.wav',
  'audio/sfx-star.wav',
  'audio/sfx-pop.wav',
  'audio/sfx-woof.wav',
  'audio/music-loop.wav',
  'audio/lucy-cheer-1.mp3',
  'audio/lucy-cheer-2.mp3',
  'audio/lucy-cheer-3.mp3',
  'audio/lucy-cheer-4.mp3',
  'audio/lucy-cheer-5.mp3',
  'audio/lucy-cheer-6.mp3',
  'audio/lucy-nudge-1.mp3',
  'audio/lucy-nudge-2.mp3',
  'audio/lucy-nudge-3.mp3',
  'audio/lucy-nudge-4.mp3',
  'audio/lucy-the-pup-l-for-lucy.mp3',
  'audio/lucy-name-a.mp3',
  'audio/lucy-name-b.mp3',
  'audio/lucy-name-c.mp3',
  'audio/lucy-name-d.mp3',
  'audio/lucy-name-e.mp3',
  'audio/lucy-name-f.mp3',
  'audio/lucy-name-g.mp3',
  'audio/lucy-name-h.mp3',
  'audio/lucy-name-i.mp3',
  'audio/lucy-name-j.mp3',
  'audio/lucy-name-k.mp3',
  'audio/lucy-name-l.mp3',
  'audio/lucy-name-m.mp3',
  'audio/lucy-name-n.mp3',
  'audio/lucy-name-o.mp3',
  'audio/lucy-name-p.mp3',
  'audio/lucy-name-q.mp3',
  'audio/lucy-name-r.mp3',
  'audio/lucy-name-s.mp3',
  'audio/lucy-name-t.mp3',
  'audio/lucy-name-u.mp3',
  'audio/lucy-name-v.mp3',
  'audio/lucy-name-w.mp3',
  'audio/lucy-name-x.mp3',
  'audio/lucy-name-y.mp3',
  'audio/lucy-name-z.mp3',
  'audio/lucy-phoneme-a.mp3',
  'audio/lucy-phoneme-b.mp3',
  'audio/lucy-phoneme-c.mp3',
  'audio/lucy-phoneme-d.mp3',
  'audio/lucy-phoneme-e.mp3',
  'audio/lucy-phoneme-f.mp3',
  'audio/lucy-phoneme-g.mp3',
  'audio/lucy-phoneme-h.mp3',
  'audio/lucy-phoneme-i.mp3',
  'audio/lucy-phoneme-j.mp3',
  'audio/lucy-phoneme-k.mp3',
  'audio/lucy-phoneme-l.mp3',
  'audio/lucy-phoneme-m.mp3',
  'audio/lucy-phoneme-n.mp3',
  'audio/lucy-phoneme-o.mp3',
  'audio/lucy-phoneme-p.mp3',
  'audio/lucy-phoneme-q.mp3',
  'audio/lucy-phoneme-r.mp3',
  'audio/lucy-phoneme-s.mp3',
  'audio/lucy-phoneme-t.mp3',
  'audio/lucy-phoneme-u.mp3',
  'audio/lucy-phoneme-v.mp3',
  'audio/lucy-phoneme-w.mp3',
  'audio/lucy-phoneme-x.mp3',
  'audio/lucy-phoneme-y.mp3',
  'audio/lucy-phoneme-z.mp3',
  'audio/lucy-word-a-apple.mp3',
  'audio/lucy-word-a-alligator.mp3',
  'audio/lucy-word-a-astronaut.mp3',
  'audio/lucy-word-a-ant.mp3',
  'audio/lucy-word-a-airplane.mp3',
  'audio/lucy-word-a-acorn.mp3',
  'audio/lucy-word-a-ambulance.mp3',
  'audio/lucy-word-a-avocado.mp3',
  'audio/lucy-word-a-anchor.mp3',
  'audio/lucy-word-a-alpaca.mp3',
  'audio/lucy-word-a-apron.mp3',
  'audio/lucy-word-a-asteroid.mp3',
  'audio/lucy-word-a-alarm.mp3',
  'audio/lucy-word-a-artichoke.mp3',
  'audio/lucy-word-a-axolotl.mp3',
  'audio/lucy-word-b-ball.mp3',
  'audio/lucy-word-b-bear.mp3',
  'audio/lucy-word-b-banana.mp3',
  'audio/lucy-word-b-butterfly.mp3',
  'audio/lucy-word-b-bus.mp3',
  'audio/lucy-word-b-bird.mp3',
  'audio/lucy-word-b-boat.mp3',
  'audio/lucy-word-b-book.mp3',
  'audio/lucy-word-b-balloon.mp3',
  'audio/lucy-word-b-bee.mp3',
  'audio/lucy-word-b-bread.mp3',
  'audio/lucy-word-b-bike.mp3',
  'audio/lucy-word-b-bucket.mp3',
  'audio/lucy-word-b-bunny.mp3',
  'audio/lucy-word-b-broccoli.mp3',
  'audio/lucy-word-c-cat.mp3',
  'audio/lucy-word-c-car.mp3',
  'audio/lucy-word-c-cake.mp3',
  'audio/lucy-word-c-cow.mp3',
  'audio/lucy-word-c-cup.mp3',
  'audio/lucy-word-c-castle.mp3',
  'audio/lucy-word-c-carrot.mp3',
  'audio/lucy-word-c-cloud.mp3',
  'audio/lucy-word-c-crab.mp3',
  'audio/lucy-word-c-crown.mp3',
  'audio/lucy-word-c-cookie.mp3',
  'audio/lucy-word-c-camera.mp3',
  'audio/lucy-word-c-candle.mp3',
  'audio/lucy-word-c-caterpillar.mp3',
  'audio/lucy-word-c-corn.mp3',
  'audio/lucy-word-d-dog.mp3',
  'audio/lucy-word-d-duck.mp3',
  'audio/lucy-word-d-drum.mp3',
  'audio/lucy-word-d-door.mp3',
  'audio/lucy-word-d-donut.mp3',
  'audio/lucy-word-d-dinosaur.mp3',
  'audio/lucy-word-d-dragon.mp3',
  'audio/lucy-word-d-dolphin.mp3',
  'audio/lucy-word-d-desk.mp3',
  'audio/lucy-word-d-daisy.mp3',
  'audio/lucy-word-d-donkey.mp3',
  'audio/lucy-word-d-dice.mp3',
  'audio/lucy-word-d-doll.mp3',
  'audio/lucy-word-d-diamond.mp3',
  'audio/lucy-word-d-deer.mp3',
  'audio/lucy-word-e-egg.mp3',
  'audio/lucy-word-e-elephant.mp3',
  'audio/lucy-word-e-eagle.mp3',
  'audio/lucy-word-e-ear.mp3',
  'audio/lucy-word-e-envelope.mp3',
  'audio/lucy-word-e-engine.mp3',
  'audio/lucy-word-e-elf.mp3',
  'audio/lucy-word-e-earth.mp3',
  'audio/lucy-word-e-elbow.mp3',
  'audio/lucy-word-e-eraser.mp3',
  'audio/lucy-word-e-eye.mp3',
  'audio/lucy-word-e-eight.mp3',
  'audio/lucy-word-e-elevator.mp3',
  'audio/lucy-word-e-eleven.mp3',
  'audio/lucy-word-e-evergreen.mp3',
  'audio/lucy-word-f-fish.mp3',
  'audio/lucy-word-f-frog.mp3',
  'audio/lucy-word-f-flower.mp3',
  'audio/lucy-word-f-fox.mp3',
  'audio/lucy-word-f-fireworks.mp3',
  'audio/lucy-word-f-fire.mp3',
  'audio/lucy-word-f-fork.mp3',
  'audio/lucy-word-f-feather.mp3',
  'audio/lucy-word-f-flag.mp3',
  'audio/lucy-word-f-foot.mp3',
  'audio/lucy-word-f-fire-truck.mp3',
  'audio/lucy-word-f-fairy.mp3',
  'audio/lucy-word-f-fries.mp3',
  'audio/lucy-word-f-flamingo.mp3',
  'audio/lucy-word-f-football.mp3',
  'audio/lucy-word-g-goat.mp3',
  'audio/lucy-word-g-grapes.mp3',
  'audio/lucy-word-g-guitar.mp3',
  'audio/lucy-word-g-gift.mp3',
  'audio/lucy-word-g-ghost.mp3',
  'audio/lucy-word-g-girl.mp3',
  'audio/lucy-word-g-glasses.mp3',
  'audio/lucy-word-g-grass.mp3',
  'audio/lucy-word-g-globe.mp3',
  'audio/lucy-word-g-gum.mp3',
  'audio/lucy-word-g-garden.mp3',
  'audio/lucy-word-g-glue.mp3',
  'audio/lucy-word-g-gorilla.mp3',
  'audio/lucy-word-g-grasshopper.mp3',
  'audio/lucy-word-g-game.mp3',
  'audio/lucy-word-h-hat.mp3',
  'audio/lucy-word-h-house.mp3',
  'audio/lucy-word-h-horse.mp3',
  'audio/lucy-word-h-heart.mp3',
  'audio/lucy-word-h-hand.mp3',
  'audio/lucy-word-h-hammer.mp3',
  'audio/lucy-word-h-helicopter.mp3',
  'audio/lucy-word-h-honey.mp3',
  'audio/lucy-word-h-hippo.mp3',
  'audio/lucy-word-h-hook.mp3',
  'audio/lucy-word-h-hot-dog.mp3',
  'audio/lucy-word-h-hen.mp3',
  'audio/lucy-word-h-hug.mp3',
  'audio/lucy-word-h-hamburger.mp3',
  'audio/lucy-word-h-hedgehog.mp3',
  'audio/lucy-word-i-igloo.mp3',
  'audio/lucy-word-i-ice-cream.mp3',
  'audio/lucy-word-i-island.mp3',
  'audio/lucy-word-i-ink.mp3',
  'audio/lucy-word-i-insect.mp3',
  'audio/lucy-word-i-iguana.mp3',
  'audio/lucy-word-i-invitation.mp3',
  'audio/lucy-word-i-instrument.mp3',
  'audio/lucy-word-i-ice-skate.mp3',
  'audio/lucy-word-i-ivy.mp3',
  'audio/lucy-word-i-iceberg.mp3',
  'audio/lucy-word-i-ice-hockey.mp3',
  'audio/lucy-word-i-infant.mp3',
  'audio/lucy-word-i-ice-pop.mp3',
  'audio/lucy-word-i-inn.mp3',
  'audio/lucy-word-j-juice.mp3',
  'audio/lucy-word-j-jar.mp3',
  'audio/lucy-word-j-jacket.mp3',
  'audio/lucy-word-j-jeep.mp3',
  'audio/lucy-word-j-jet.mp3',
  'audio/lucy-word-j-jewel.mp3',
  'audio/lucy-word-j-jungle.mp3',
  'audio/lucy-word-j-jump-rope.mp3',
  'audio/lucy-word-j-jingle-bell.mp3',
  'audio/lucy-word-j-juggler.mp3',
  'audio/lucy-word-j-jaguar.mp3',
  'audio/lucy-word-j-jug.mp3',
  'audio/lucy-word-j-jelly.mp3',
  'audio/lucy-word-j-jigsaw.mp3',
  'audio/lucy-word-j-jump.mp3',
  'audio/lucy-word-k-key.mp3',
  'audio/lucy-word-k-kite.mp3',
  'audio/lucy-word-k-king.mp3',
  'audio/lucy-word-k-kitten.mp3',
  'audio/lucy-word-k-kangaroo.mp3',
  'audio/lucy-word-k-kettle.mp3',
  'audio/lucy-word-k-kiwi.mp3',
  'audio/lucy-word-k-koala.mp3',
  'audio/lucy-word-k-kayak.mp3',
  'audio/lucy-word-k-kid.mp3',
  'audio/lucy-word-k-kiss.mp3',
  'audio/lucy-word-k-knee.mp3',
  'audio/lucy-word-k-kick.mp3',
  'audio/lucy-word-k-karate.mp3',
  'audio/lucy-word-k-keyboard.mp3',
  'audio/lucy-word-l-leaf.mp3',
  'audio/lucy-word-l-lion.mp3',
  'audio/lucy-word-l-lamp.mp3',
  'audio/lucy-word-l-lemon.mp3',
  'audio/lucy-word-l-ladder.mp3',
  'audio/lucy-word-l-ladybug.mp3',
  'audio/lucy-word-l-lock.mp3',
  'audio/lucy-word-l-lollipop.mp3',
  'audio/lucy-word-l-lamb.mp3',
  'audio/lucy-word-l-log.mp3',
  'audio/lucy-word-l-lunch.mp3',
  'audio/lucy-word-l-lake.mp3',
  'audio/lucy-word-l-lobster.mp3',
  'audio/lucy-word-l-lips.mp3',
  'audio/lucy-word-l-lantern.mp3',
  'audio/lucy-word-m-moon.mp3',
  'audio/lucy-word-m-mouse.mp3',
  'audio/lucy-word-m-milk.mp3',
  'audio/lucy-word-m-map.mp3',
  'audio/lucy-word-m-monkey.mp3',
  'audio/lucy-word-m-mitten.mp3',
  'audio/lucy-word-m-mountain.mp3',
  'audio/lucy-word-m-mushroom.mp3',
  'audio/lucy-word-m-magnet.mp3',
  'audio/lucy-word-m-motorcycle.mp3',
  'audio/lucy-word-m-mango.mp3',
  'audio/lucy-word-m-mask.mp3',
  'audio/lucy-word-m-muffin.mp3',
  'audio/lucy-word-m-music.mp3',
  'audio/lucy-word-m-mug.mp3',
  'audio/lucy-word-n-nose.mp3',
  'audio/lucy-word-n-nest.mp3',
  'audio/lucy-word-n-nut.mp3',
  'audio/lucy-word-n-net.mp3',
  'audio/lucy-word-n-notebook.mp3',
  'audio/lucy-word-n-nurse.mp3',
  'audio/lucy-word-n-noodle.mp3',
  'audio/lucy-word-n-necklace.mp3',
  'audio/lucy-word-n-night.mp3',
  'audio/lucy-word-n-newspaper.mp3',
  'audio/lucy-word-n-nine.mp3',
  'audio/lucy-word-n-necktie.mp3',
  'audio/lucy-word-n-needle.mp3',
  'audio/lucy-word-n-numbers.mp3',
  'audio/lucy-word-n-notes.mp3',
  'audio/lucy-word-o-owl.mp3',
  'audio/lucy-word-o-orange.mp3',
  'audio/lucy-word-o-octopus.mp3',
  'audio/lucy-word-o-ocean.mp3',
  'audio/lucy-word-o-onion.mp3',
  'audio/lucy-word-o-otter.mp3',
  'audio/lucy-word-o-olive.mp3',
  'audio/lucy-word-o-overalls.mp3',
  'audio/lucy-word-o-oatmeal.mp3',
  'audio/lucy-word-o-orbit.mp3',
  'audio/lucy-word-o-ox.mp3',
  'audio/lucy-word-o-orangutan.mp3',
  'audio/lucy-word-o-oyster.mp3',
  'audio/lucy-word-o-office.mp3',
  'audio/lucy-word-o-omelet.mp3',
  'audio/lucy-word-p-pig.mp3',
  'audio/lucy-word-p-pizza.mp3',
  'audio/lucy-word-p-pencil.mp3',
  'audio/lucy-word-p-pear.mp3',
  'audio/lucy-word-p-penguin.mp3',
  'audio/lucy-word-p-pumpkin.mp3',
  'audio/lucy-word-p-piano.mp3',
  'audio/lucy-word-p-plane.mp3',
  'audio/lucy-word-p-popcorn.mp3',
  'audio/lucy-word-p-panda.mp3',
  'audio/lucy-word-p-pot.mp3',
  'audio/lucy-word-p-peach.mp3',
  'audio/lucy-word-p-puppy.mp3',
  'audio/lucy-word-p-pineapple.mp3',
  'audio/lucy-word-p-parrot.mp3',
  'audio/lucy-word-q-quilt.mp3',
  'audio/lucy-word-q-queen.mp3',
  'audio/lucy-word-q-question.mp3',
  'audio/lucy-word-q-quail.mp3',
  'audio/lucy-word-q-quarter.mp3',
  'audio/lucy-word-q-quill.mp3',
  'audio/lucy-word-q-quesadilla.mp3',
  'audio/lucy-word-q-quiet.mp3',
  'audio/lucy-word-q-quicksand.mp3',
  'audio/lucy-word-q-quiz.mp3',
  'audio/lucy-word-q-quote.mp3',
  'audio/lucy-word-q-quartz.mp3',
  'audio/lucy-word-q-quiche.mp3',
  'audio/lucy-word-q-quick.mp3',
  'audio/lucy-word-q-quilt-square.mp3',
  'audio/lucy-word-r-rain.mp3',
  'audio/lucy-word-r-rainbow.mp3',
  'audio/lucy-word-r-robot.mp3',
  'audio/lucy-word-r-rocket.mp3',
  'audio/lucy-word-r-rose.mp3',
  'audio/lucy-word-r-rabbit.mp3',
  'audio/lucy-word-r-ring.mp3',
  'audio/lucy-word-r-raccoon.mp3',
  'audio/lucy-word-r-radio.mp3',
  'audio/lucy-word-r-ruler.mp3',
  'audio/lucy-word-r-rhino.mp3',
  'audio/lucy-word-r-rooster.mp3',
  'audio/lucy-word-r-ribbon.mp3',
  'audio/lucy-word-r-rice.mp3',
  'audio/lucy-word-r-rat.mp3',
  'audio/lucy-word-s-sun.mp3',
  'audio/lucy-word-s-snake.mp3',
  'audio/lucy-word-s-star.mp3',
  'audio/lucy-word-s-sock.mp3',
  'audio/lucy-word-s-spoon.mp3',
  'audio/lucy-word-s-seal.mp3',
  'audio/lucy-word-s-sandwich.mp3',
  'audio/lucy-word-s-squirrel.mp3',
  'audio/lucy-word-s-strawberry.mp3',
  'audio/lucy-word-s-ship.mp3',
  'audio/lucy-word-s-spider.mp3',
  'audio/lucy-word-s-shoe.mp3',
  'audio/lucy-word-s-soap.mp3',
  'audio/lucy-word-s-snail.mp3',
  'audio/lucy-word-s-scissors.mp3',
  'audio/lucy-word-t-tree.mp3',
  'audio/lucy-word-t-tiger.mp3',
  'audio/lucy-word-t-train.mp3',
  'audio/lucy-word-t-turtle.mp3',
  'audio/lucy-word-t-truck.mp3',
  'audio/lucy-word-t-tomato.mp3',
  'audio/lucy-word-t-tent.mp3',
  'audio/lucy-word-t-tooth.mp3',
  'audio/lucy-word-t-tractor.mp3',
  'audio/lucy-word-t-triangle.mp3',
  'audio/lucy-word-t-turkey.mp3',
  'audio/lucy-word-t-telescope.mp3',
  'audio/lucy-word-t-tulip.mp3',
  'audio/lucy-word-t-trophy.mp3',
  'audio/lucy-word-t-taxi.mp3',
  'audio/lucy-word-u-umbrella.mp3',
  'audio/lucy-word-u-unicorn.mp3',
  'audio/lucy-word-u-up.mp3',
  'audio/lucy-word-u-under.mp3',
  'audio/lucy-word-u-ukulele.mp3',
  'audio/lucy-word-u-uncle.mp3',
  'audio/lucy-word-u-ufo.mp3',
  'audio/lucy-word-u-underground.mp3',
  'audio/lucy-word-u-universe.mp3',
  'audio/lucy-word-u-unlock.mp3',
  'audio/lucy-word-u-umpire.mp3',
  'audio/lucy-word-u-upside-down.mp3',
  'audio/lucy-word-u-utensils.mp3',
  'audio/lucy-word-u-underwater.mp3',
  'audio/lucy-word-u-uniform.mp3',
  'audio/lucy-word-v-van.mp3',
  'audio/lucy-word-v-violin.mp3',
  'audio/lucy-word-v-volcano.mp3',
  'audio/lucy-word-v-village.mp3',
  'audio/lucy-word-v-volleyball.mp3',
  'audio/lucy-word-v-violet.mp3',
  'audio/lucy-word-v-vet.mp3',
  'audio/lucy-word-v-vampire.mp3',
  'audio/lucy-word-v-video.mp3',
  'audio/lucy-word-v-vegetables.mp3',
  'audio/lucy-word-v-valentine.mp3',
  'audio/lucy-word-v-vine.mp3',
  'audio/lucy-word-v-vanilla.mp3',
  'audio/lucy-word-v-voice.mp3',
  'audio/lucy-word-v-vault.mp3',
  'audio/lucy-word-w-watermelon.mp3',
  'audio/lucy-word-w-wagon.mp3',
  'audio/lucy-word-w-whale.mp3',
  'audio/lucy-word-w-worm.mp3',
  'audio/lucy-word-w-window.mp3',
  'audio/lucy-word-w-wolf.mp3',
  'audio/lucy-word-w-watch.mp3',
  'audio/lucy-word-w-water.mp3',
  'audio/lucy-word-w-wand.mp3',
  'audio/lucy-word-w-waffle.mp3',
  'audio/lucy-word-w-web.mp3',
  'audio/lucy-word-w-wheel.mp3',
  'audio/lucy-word-w-witch.mp3',
  'audio/lucy-word-w-wheat.mp3',
  'audio/lucy-word-w-winter.mp3',
  'audio/lucy-word-x-xylophone.mp3',
  'audio/lucy-word-x-x-ray.mp3',
  'audio/lucy-word-x-x-mark.mp3',
  'audio/lucy-word-x-xmas-tree.mp3',
  'audio/lucy-word-x-xmas-star.mp3',
  'audio/lucy-word-x-x-ray-fish.mp3',
  'audio/lucy-word-x-x-ray-glasses.mp3',
  'audio/lucy-word-x-x-ray-hand.mp3',
  'audio/lucy-word-x-x-ray-bone.mp3',
  'audio/lucy-word-x-x-ray-heart.mp3',
  'audio/lucy-word-x-xmas-ball.mp3',
  'audio/lucy-word-x-xmas-snow.mp3',
  'audio/lucy-word-x-xmas-chime.mp3',
  'audio/lucy-word-x-xmas-sled.mp3',
  'audio/lucy-word-x-xmas-angel.mp3',
  'audio/lucy-word-y-yarn.mp3',
  'audio/lucy-word-y-yo-yo.mp3',
  'audio/lucy-word-y-yak.mp3',
  'audio/lucy-word-y-yellow.mp3',
  'audio/lucy-word-y-yacht.mp3',
  'audio/lucy-word-y-yard.mp3',
  'audio/lucy-word-y-yam.mp3',
  'audio/lucy-word-y-yawn.mp3',
  'audio/lucy-word-y-yoga.mp3',
  'audio/lucy-word-y-yellow-bird.mp3',
  'audio/lucy-word-y-yell.mp3',
  'audio/lucy-word-y-yodel.mp3',
  'audio/lucy-word-y-yummy.mp3',
  'audio/lucy-word-y-yolk.mp3',
  'audio/lucy-word-y-yes.mp3',
  'audio/lucy-word-z-zebra.mp3',
  'audio/lucy-word-z-zoo.mp3',
  'audio/lucy-word-z-zipper.mp3',
  'audio/lucy-word-z-zero.mp3',
  'audio/lucy-word-z-zucchini.mp3',
  'audio/lucy-word-z-zigzag.mp3',
  'audio/lucy-word-z-zinnia.mp3',
  'audio/lucy-word-z-zap.mp3',
  'audio/lucy-word-z-zoom.mp3',
  'audio/lucy-word-z-zombie.mp3',
  'audio/lucy-word-z-zzz.mp3',
  'audio/lucy-word-z-zebra-crossing.mp3',
  'audio/lucy-word-z-zipper-bag.mp3',
  'audio/lucy-word-z-zoo-train.mp3',
  'audio/lucy-word-z-zither.mp3',
  'icons/icon.svg',
  'icons/icon-maskable.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'fonts/Comfortaa-Medium.woff2',
  'fonts/Comfortaa-Bold.woff2',
  'fonts/NunitoSans-SemiBold.woff2',
  'fonts/NunitoSans-Bold.woff2',
  'fonts/NunitoSans-ExtraBold.woff2',
  'fonts/NunitoSans-Black.woff2'
];
/* Self-hosted fonts (fonts/README.md) are pinned above, never fetched from
   googleapis — an offline cart has no network to swap a face in from. The
   @font-face rules that name them live at the top of css/tokens.css, and the
   system fallback stacks there are what a child reads if one is ever evicted. */

function shellUrl(path) {
  return new URL(path, self.registration.scope);
}

/* Only a complete, same-origin 200 belongs in the offline shell. A 206 from a
   ranged <audio> read throws inside cache.put, and an opaque cross-origin body
   would cache a response we cannot even read the status of. */
function cacheable(response) {
  return !!response
    && response.status === 200
    && response.type !== 'opaque'
    && response.type !== 'opaqueredirect';
}

/* One shell file, retried once. School Wi-Fi drops a single request far more
   often than it stays down, and a half-cached shell is the failure teachers
   cannot diagnose — better to spend one extra request here. */
async function fetchShellFile(url) {
  let last = 'failed';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, { cache: 'reload', credentials: 'same-origin' });
      if (cacheable(response)) return response;
      last = `HTTP ${response.status}`;
    } catch (err) {
      last = err.message || String(err);
    }
  }
  throw new Error(last);
}

async function precacheInto(cache, onProgress) {
  const missing = [];
  let done = 0;
  for (const path of SHELL) {
    const url = shellUrl(path);
    try {
      await cache.put(url, await fetchShellFile(url));
    } catch (err) {
      missing.push(`${path} → ${err.message || err}`);
    }
    done += 1;
    if (onProgress) onProgress(done, SHELL.length);
  }
  if (missing.length) throw new Error(missing.join('; '));
  return SHELL.length;
}

/* What is really in the cache right now — not what we wrote down last time.
   Chrome evicts storage on a full cart Chromebook without telling anyone, and
   a tablet that says "Ready offline" but is not is the worst Monday. */
async function shellHealth() {
  const cache = await caches.open(VERSION);
  const missing = [];
  for (const path of SHELL) {
    const hit = await cache.match(shellUrl(path), { ignoreSearch: true });
    if (!hit) missing.push(path);
  }
  return { version: VERSION, total: SHELL.length, cached: SHELL.length - missing.length, missing };
}

self.addEventListener('install', (event) => {
  /* No hand-over here — a newer pin installs quietly and then waits, until
     Grown-Ups → Device → Get update asks for it. */
  event.waitUntil(caches.open(VERSION).then((cache) => precacheInto(cache)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== VERSION).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

/* Cache-first: the cart Chromebook is often offline on purpose.
   Never intercept sw.js — Get update must be able to fetch a new pin.
   Dev files (_check.mjs, _flow.mjs, _smoke.html) are never cached either, so a
   smoke bookmark always runs the file on disk. */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/sw.js')) return;
  if (/\/_[^/]*$/.test(url.pathname)) return;

  event.respondWith((async () => {
    const hit = await caches.match(request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const response = await fetch(request);
      if (cacheable(response)) {
        const copy = response.clone();
        caches.open(VERSION)
          .then((cache) => cache.put(request, copy))
          .catch(() => {});
      }
      return response;
    } catch (err) {
      // Navigations fall back to the shell so the app still opens offline.
      if (request.mode === 'navigate') {
        const shell = await caches.match(shellUrl('index.html'))
          || await caches.match('index.html')
          || await caches.match(shellUrl('./'));
        if (shell) return shell;
      }
      return new Response('offline', { status: 503, statusText: 'offline' });
    }
  })());
});

/* Teacher-driven precache with progress, plus a real cache-health read.
   SKIP_WAITING is what Get update sends to hand over to a newer pin. */
self.addEventListener('message', (event) => {
  const msg = event.data || {};
  const port = event.ports && event.ports[0];

  if (msg.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
    return;
  }

  if (msg.type === 'HEALTH') {
    if (!port) return;
    event.waitUntil(shellHealth().then(
      (health) => port.postMessage({ type: 'health', ...health }),
      (err) => port.postMessage({ type: 'error', message: String(err.message || err) }),
    ));
    return;
  }

  if (msg.type !== 'PRECACHE') return;
  if (!port) return;

  event.waitUntil((async () => {
    try {
      const cache = await caches.open(VERSION);
      const count = await precacheInto(cache, (done, total) => {
        port.postMessage({ type: 'progress', done, total });
      });
      port.postMessage({ type: 'done', count, version: VERSION });
    } catch (err) {
      port.postMessage({ type: 'error', message: String(err.message || err) });
    }
  })());
});
