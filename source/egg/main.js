        import * as THREE from './lib/three.module.js';
        import { OrbitControls } from './lib/addons/controls/OrbitControls.js';

        // ============================================================
        //  1. 虎鲸配置 (完全不变)
        // ============================================================
        const BODY_PROFILE = [
            [0.0, 2.35], [0.15, 2.32], [0.35, 2.25], [0.55, 2.12],
            [0.75, 1.95], [0.95, 1.75], [1.12, 1.45], [1.22, 1.15],
            [1.28, 0.85], [1.32, 0.55], [1.34, 0.25], [1.32, -0.05],
            [1.25, -0.35], [1.12, -0.65], [0.95, -0.95], [0.72, -1.25],
            [0.48, -1.55], [0.28, -1.85], [0.12, -2.1], [0.0, -2.3]
        ];
        const BODY_SCALE = { belowZero: 0.54, aboveZero: 0.95 };
        const DORSAL = { position: [-0.35, 1.15, 0], rotation: [0, 0, -0.08], scale: [0.7, 0.42, 0.7] };
        const PECTORAL_LEFT = { position: [-0.85, 0.15, -0.72], rotation: [-0.25, Math.PI / 3.5, 0.15] };
        const EYE_GROUP = { position: [-1.55, 0.45, -0.93], rotation: [0.25, 0.5, 0.08], scale: [1.15, 0.6, 0.95] };
        const EYEBALL = { position: [-0.09, -0.14, 0.02], scale: [0.8, 0.8, 0.45], radius: 0.18 };
        const PUPIL = { position: [-0.22, -0.28, 0.07], scale: [0.9, 0.9, 0.55], radius: 0.09 };

        // ============================================================
        //  2. 场景、灯光、相机、渲染器
        // ============================================================
        const paperColor = 0xe8dfd2;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(paperColor);
        scene.fog = new THREE.FogExp2(0xd5ccc0, 0.00015);
        const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
        camera.position.set(6.2, 2.5, 7.6);
        camera.lookAt(0, 0, 0);
        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.setClearColor(paperColor);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xd5cfc5, 1.1);
        scene.add(ambientLight);
        const keyLight = new THREE.DirectionalLight(0xfff5eb, 0.9);
        keyLight.position.set(5, 6, 5);
        keyLight.castShadow = true;
        keyLight.receiveShadow = true;
        keyLight.shadow.mapSize.width = 512;
        keyLight.shadow.mapSize.height = 512;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 50;
        keyLight.shadow.camera.left = -10;
        keyLight.shadow.camera.right = 10;
        keyLight.shadow.camera.top = 10;
        keyLight.shadow.camera.bottom = -8;
        scene.add(keyLight);
        function addFillLight(color, intensity, x, y, z) {
            const light = new THREE.DirectionalLight(color, intensity);
            light.position.set(x, y, z);
            scene.add(light);
        }
        addFillLight(0xc8c0b5, 0.55, -4, 2, 4);
        addFillLight(0xddd8cf, 0.45, -5, 1, -5);
        addFillLight(0xbfb8ad, 0.5, -2, -0.5, -5);
        addFillLight(0xe8e3da, 0.4, 0, 6, 0);
        addFillLight(0xa09890, 0.35, 0, -3, 1);

        const gmCanvas = document.createElement('canvas');
        gmCanvas.width = 9;
        gmCanvas.height = 1;
        const gmCtx = gmCanvas.getContext('2d');
        gmCtx.fillStyle = '#1a1512';
        gmCtx.fillRect(0, 0, 3, 1);
        gmCtx.fillStyle = '#5c5550';
        gmCtx.fillRect(3, 0, 3, 1);
        gmCtx.fillStyle = '#a09890';
        gmCtx.fillRect(6, 0, 3, 1);
        const gradientMap = new THREE.CanvasTexture(gmCanvas);
        gradientMap.minFilter = THREE.NearestFilter;
        gradientMap.magFilter = THREE.NearestFilter;
        const createInkToonMaterial = (c) => new THREE.MeshToonMaterial({ color: c || 0x1a1512, gradientMap,
            side: THREE.DoubleSide });

        // ============================================================
        //  3. 虎鲸主体
        // ============================================================
        const orcaGroup = new THREE.Group();
        orcaGroup.name = "orcaGroup";
        scene.add(orcaGroup);

        const profileVectors = BODY_PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
        const curve = new THREE.CatmullRomCurve3(profileVectors.map(p => new THREE.Vector3(p.x, p.y, 0)), false,
        'catmullrom', 0.5);
        const sampledPoints = curve.getPoints(300);
        const pts = sampledPoints.map(p => new THREE.Vector2(p.x, p.y));
        const bodyGeo = new THREE.LatheGeometry(pts, 128);
        bodyGeo.rotateZ(Math.PI / 2);
        const posAttrBody = bodyGeo.attributes.position;
        for (let i = 0; i < posAttrBody.count; i++) {
            const y = posAttrBody.getY(i);
            if (y < 0) posAttrBody.setY(i, y * BODY_SCALE.belowZero);
            else if (y > 0.2) posAttrBody.setY(i, y * BODY_SCALE.aboveZero);
        }
        bodyGeo.computeVertexNormals();
        const colors = new Float32Array(posAttrBody.count * 3);
        const inkBlack = new THREE.Color(0x1a1512);
        const paperWhite = new THREE.Color(0xfaf7f0);
        const midGray = new THREE.Color(0x8a827a);
        for (let i = 0; i < posAttrBody.count; i++) {
            const y = posAttrBody.getY(i);
            let color;
            if (y > 0.15) color = inkBlack;
            else if (y < -0.15) color = paperWhite;
            else if (y > 0.02) color = new THREE.Color().lerpColors(midGray, inkBlack, (y - 0.02) / 0.13);
            else if (y < -0.02) color = new THREE.Color().lerpColors(midGray, paperWhite, (y + 0.02) / -0.13);
            else color = midGray;
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        bodyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const bodyMat = new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0x111111, shininess: 5,
            side: THREE.DoubleSide, emissive: 0x000000, emissiveIntensity: 0.03 });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.castShadow = bodyMesh.receiveShadow = true;
        bodyMesh.name = "orcaBody";
        orcaGroup.add(bodyMesh);

        const dorsalFinGroup = new THREE.Group();
        const dorsalShape = new THREE.Shape();
        dorsalShape.moveTo(-0.55, 0);
        dorsalShape.bezierCurveTo(-0.4, 0.5, -0.2, 1.1, 0.15, 1.5);
        dorsalShape.bezierCurveTo(0.3, 1.7, 0.5, 1.95, 0.6, 2.0);
        dorsalShape.bezierCurveTo(0.68, 1.85, 0.7, 1.65, 0.6, 1.45);
        dorsalShape.bezierCurveTo(0.45, 1.0, 0.3, 0.5, 0.2, 0);
        dorsalShape.lineTo(-0.55, 0);
        const dorsalGeo = new THREE.ExtrudeGeometry(dorsalShape, { steps: 1, depth: 0.04, bevelEnabled: true,
            bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
        const dorsalFin = new THREE.Mesh(dorsalGeo, createInkToonMaterial());
        dorsalFin.castShadow = dorsalFin.receiveShadow = true;
        dorsalFin.position.set(-0.08, 0, -0.02);
        dorsalFin.name = "orcaDorsal";
        dorsalFinGroup.add(dorsalFin);
        dorsalFinGroup.position.set(...DORSAL.position);
        dorsalFinGroup.rotation.set(...DORSAL.rotation);
        dorsalFinGroup.scale.set(...DORSAL.scale);
        orcaGroup.add(dorsalFinGroup);

        const tailGroup = new THREE.Group();
        tailGroup.name = "tailGroup";
        const tailMat = createInkToonMaterial();
        const createTailBlade = (s) => {
            const sh = new THREE.Shape();
            sh.moveTo(0, 0);
            sh.quadraticCurveTo(0.7, 0.55 * s, 1.25, 1.05 * s);
            sh.quadraticCurveTo(1.55, 0.7 * s, 1.0, 0);
            sh.quadraticCurveTo(0.4, -0.15 * s, 0, 0);
            const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { steps: 1, depth: 0.07, bevelEnabled: true,
                bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2 }), tailMat);
            m.castShadow = m.receiveShadow = true;
            return m;
        };
        const upperTail = createTailBlade(1);
        const lowerTail = createTailBlade(-1);
        upperTail.rotation.x = lowerTail.rotation.x = -Math.PI / 2;
        upperTail.name = "orcaTailUpper";
        lowerTail.name = "orcaTailLower";
        tailGroup.add(upperTail);
        tailGroup.add(lowerTail);
        tailGroup.position.set(1.34, 0, 0);
        orcaGroup.add(tailGroup);

        const pecShape = new THREE.Shape();
        pecShape.moveTo(0.6, 0);
        pecShape.quadraticCurveTo(1.2, 0.7, 1.9, 0.9);
        pecShape.quadraticCurveTo(2.1, 0.35, 1.5, -0.05);
        pecShape.quadraticCurveTo(1.1, -0.12, 0.6, 0);
        const pecSet = { steps: 1, depth: 0.05, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02,
            bevelSegments: 2 };
        const pecMat = createInkToonMaterial();
        const leftPecGroup = new THREE.Group();
        const leftPec = new THREE.Mesh(new THREE.ExtrudeGeometry(pecShape, pecSet), pecMat);
        leftPec.castShadow = leftPec.receiveShadow = true;
        leftPec.name = "orcaPecLeft";
        leftPecGroup.add(leftPec);
        leftPecGroup.position.set(...PECTORAL_LEFT.position);
        leftPecGroup.rotation.set(...PECTORAL_LEFT.rotation);
        orcaGroup.add(leftPecGroup);
        const rightPecGroup = new THREE.Group();
        const rightPecGeo = new THREE.ExtrudeGeometry(pecShape, pecSet);
        rightPecGeo.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, -1));
        rightPecGeo.computeVertexNormals();
        const rightPec = new THREE.Mesh(rightPecGeo, pecMat);
        rightPec.castShadow = rightPec.receiveShadow = true;
        rightPec.name = "orcaPecRight";
        rightPecGroup.add(rightPec);
        rightPecGroup.position.set(-0.85, 0.15, 0.72);
        rightPecGroup.rotation.set(-0.25, -Math.PI / 3.5, -0.15);
        orcaGroup.add(rightPecGroup);

        const magatamaShape = new THREE.Shape();
        magatamaShape.moveTo(0, 0.12);
        magatamaShape.bezierCurveTo(0.2, 0.32, 0.6, 0.28, 0.65, 0.05);
        magatamaShape.bezierCurveTo(0.68, -0.08, 0.52, -0.22, 0.33, -0.18);
        magatamaShape.bezierCurveTo(0.18, -0.14, 0.08, -0.04, 0.03, 0.05);
        magatamaShape.bezierCurveTo(0, 0.1, -0.02, 0.12, 0, 0.12);
        const browSet = { steps: 1, depth: 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01,
            bevelSegments: 2 };
        const browMat = new THREE.MeshPhongMaterial({ color: 0xfaf7f0, specular: 0x111111, shininess: 8,
            side: THREE.DoubleSide });
        const eyeWhiteMat = new THREE.MeshPhongMaterial({ color: 0xfaf7f0, specular: 0x111111, shininess: 15 });
        const pupilMat = new THREE.MeshPhongMaterial({ color: 0x0a0a0a, specular: 0x000000, shininess: 5 });
        const highlightMat = new THREE.MeshPhongMaterial({ color: 0xfaf7f0, specular: 0x000000, shininess: 5 });
        const createEyeGroup = () => {
            const g = new THREE.Group();
            const brow = new THREE.Mesh(new THREE.ExtrudeGeometry(magatamaShape, browSet), browMat);
            brow.castShadow = brow.receiveShadow = true;
            g.add(brow);
            const eye = new THREE.Mesh(new THREE.SphereGeometry(EYEBALL.radius, 32, 32), eyeWhiteMat);
            eye.position.set(...EYEBALL.position);
            eye.scale.set(...EYEBALL.scale);
            eye.castShadow = eye.receiveShadow = true;
            g.add(eye);
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(PUPIL.radius, 32, 32), pupilMat);
            pupil.position.set(...PUPIL.position);
            pupil.scale.set(...PUPIL.scale);
            g.add(pupil);
            const hl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), highlightMat);
            hl.position.set(-0.19, -0.25, 0.09);
            g.add(hl);
            g.position.set(...EYE_GROUP.position);
            g.rotation.set(...EYE_GROUP.rotation);
            g.scale.set(...EYE_GROUP.scale);
            return g;
        };
        const leftEyeGroup = createEyeGroup();
        orcaGroup.add(leftEyeGroup);
        const rightEyeGroup = leftEyeGroup.clone(true);
        rightEyeGroup.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, -1));
        rightEyeGroup.traverse(c => { if (c.isMesh) c.geometry.computeVertexNormals(); });
        orcaGroup.add(rightEyeGroup);

        // ============================================================
        //  4. 水墨荷叶
        // ============================================================
        function createLotusLeaf(x, y, z, scale, rotY, leafColor, leafOpacity) {
            const leafGroup = new THREE.Group();
            const geo = new THREE.CircleGeometry(1, 24);
            const mat = new THREE.MeshToonMaterial({ color: leafColor, side: THREE.DoubleSide, transparent: true,
                opacity: leafOpacity });
            const leaf = new THREE.Mesh(geo, mat);
            leaf.rotation.x = -Math.PI / 2;
            leafGroup.add(leaf);
            const veinColor = new THREE.Color(leafColor).multiplyScalar(0.45);
            const veinMat = new THREE.LineBasicMaterial({ color: veinColor, transparent: true, opacity: leafOpacity *
                    0.7 });
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const points = [new THREE.Vector3(0, 0.012, 0), new THREE.Vector3(Math.cos(angle) * 0.9, 0.012, Math.sin(
                    angle) * 0.9)];
                leafGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), veinMat));
            }
            const stemGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.35, 6);
            const stemMat = new THREE.MeshToonMaterial({ color: new THREE.Color(leafColor).multiplyScalar(0.55),
                transparent: true, opacity: leafOpacity * 0.8 });
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = -0.18;
            leafGroup.add(stem);
            leafGroup.position.set(x, y, z);
            leafGroup.scale.set(scale, scale, scale);
            leafGroup.rotation.y = rotY;
            scene.add(leafGroup);
        }
        const leafGrayPalette = [0x2a2a2a, 0x333333, 0x3d3d3d, 0x4a4a4a, 0x555555, 0x5f5f5f, 0x383838, 0x424242, 0x505050,
            0x2f2f2f, 0x474747, 0x3a3a3a
        ];
        for (let i = 0; i < 14; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 4.0 + Math.random() * 6.5;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius * 0.8;
            const y = -1.8 + Math.random() * 0.4;
            const grayColor = leafGrayPalette[i % leafGrayPalette.length] || (0x2a2a2a + Math.floor(Math.random() * 0x40) *
                0x010101);
            createLotusLeaf(x, y, z, 0.6 + Math.random() * 0.8, Math.random() * Math.PI, grayColor, 0.45 + Math.random() *
                0.35);
        }

        // ============================================================
        //  5. 水墨荷花
        // ============================================================
        const lotusFlowers = [];

        function createLotusFlower(x, y, z, scale) {
            const flowerGroup = new THREE.Group();
            const outerPetalMat = new THREE.MeshPhongMaterial({ color: 0xf8f5ec, specular: 0x1a1a1a, shininess: 6,
                transparent: true, opacity: 0.65, side: THREE.DoubleSide, emissive: 0x111111, emissiveIntensity: 0.04,
                depthWrite: true });
            const innerPetalMat = new THREE.MeshPhongMaterial({ color: 0xfefdfa, specular: 0x1a1a1a, shininess: 8,
                transparent: true, opacity: 0.75, side: THREE.DoubleSide, emissive: 0x1a1a1a, emissiveIntensity: 0.05,
                depthWrite: true });

            function createPetal(width, height, depth, tipOffset = 0.08) {
                const geo = new THREE.SphereGeometry(1, 14, 10);
                const positions = geo.attributes.position;
                for (let i = 0; i < positions.count; i++) {
                    let px = positions.getX(i);
                    let py = positions.getY(i);
                    let pz = positions.getZ(i);
                    const widthFactor = 1 - (py + 1) * 0.35;
                    positions.setXYZ(i, px * width * widthFactor, py * height + tipOffset * (py + 1), pz * depth *
                        widthFactor);
                }
                geo.computeVertexNormals();
                return geo;
            }
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const petal = new THREE.Mesh(createPetal(0.30, 0.60, 0.09, 0.06), outerPetalMat);
                petal.position.set(Math.cos(angle) * 0.22, 0.28, Math.sin(angle) * 0.22);
                petal.rotation.y = -angle;
                petal.rotation.z = -0.65;
                flowerGroup.add(petal);
            }
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + 0.4;
                const petal = new THREE.Mesh(createPetal(0.22, 0.48, 0.07, 0.05), innerPetalMat);
                petal.position.set(Math.cos(angle) * 0.12, 0.32, Math.sin(angle) * 0.12);
                petal.rotation.y = -angle;
                petal.rotation.z = -0.40;
                flowerGroup.add(petal);
            }
            const pistil = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.12, 12), new THREE
        .MeshPhongMaterial({ color: 0xe8d7a3, specular: 0x111111, shininess: 6, transparent: true, opacity: 0.85,
                emissive: 0x111111, emissiveIntensity: 0.08, depthWrite: true }));
            pistil.position.y = 0.32;
            flowerGroup.add(pistil);
            const dotMat = new THREE.MeshPhongMaterial({ color: 0xf5e8c0, specular: 0x000000, shininess: 4,
                emissive: 0x111111, emissiveIntensity: 0.1, depthWrite: true });
            for (let i = 0; i < 9; i++) {
                const a = (i / 9) * Math.PI * 2;
                const dot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), dotMat);
                dot.position.set(Math.cos(a) * 0.11, 0.38, Math.sin(a) * 0.11);
                flowerGroup.add(dot);
            }
            flowerGroup.position.set(x, y, z);
            flowerGroup.scale.set(scale, scale * 0.5, scale);
            flowerGroup.rotation.y = Math.random() * Math.PI * 2;
            scene.add(flowerGroup);
            lotusFlowers.push({ group: flowerGroup, baseY: y, phase: Math.random() * Math.PI * 2, floatSpeed: 0.6 + Math
                    .random() * 0.7, rotSpeed: 0.001 + Math.random() * 0.003 });
        }
        const flowerPositions = [
            { x: -4.5, z: -4.0, y: -1.45, s: 2.2 }, { x: 5.0, z: -3.2, y: -1.5, s: 2.0 }, { x: -2.5, z: 4.5, y: -1.4,
                s: 2.1 },
            { x: 5.5, z: 3.5, y: -1.48, s: 2.3 }, { x: -5.2, z: 2.8, y: -1.52, s: 1.9 }, { x: 3.0, z: -5.0, y: -1.38,
                s: 2.15 },
            { x: -1.5, z: -5.5, y: -1.46, s: 2.0 }, { x: 5.8, z: -0.8, y: -1.42, s: 2.25 }, { x: -4.0, z: -1.5,
                y: -1.44, s: 2.05 },
            { x: 1.5, z: 5.2, y: -1.48, s: 2.1 }
        ];
        flowerPositions.forEach(fp => createLotusFlower(fp.x, fp.y, fp.z, fp.s));

        // ============================================================
        //  6. 涟漪
        // ============================================================
        const ripples = [];

        function addRipple(point) {
            const geo = new THREE.RingGeometry(0.15, 0.35, 32);
            const mat = new THREE.MeshBasicMaterial({ color: 0x3a3530, transparent: true, opacity: 0.6,
                side: THREE.DoubleSide, depthWrite: false });
            const ripple = new THREE.Mesh(geo, mat);
            ripple.position.copy(point);
            ripple.position.y = -1.4;
            ripple.rotation.x = -Math.PI / 2;
            scene.add(ripple);
            ripples.push({ mesh: ripple, life: 1.0 });
        }

        // ============================================================
        //  7. 小鱼系统
        // ============================================================
        const fishes = [];

        function createFishMesh(color = 0x888888) {
            const group = new THREE.Group();
            const bodyGeo = new THREE.SphereGeometry(0.2, 8, 8);
            const bodyMat = new THREE.MeshToonMaterial({ color: color });
            const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            bodyMesh.scale.set(1, 0.6, 0.4);
            group.add(bodyMesh);
            const tailGeo = new THREE.ConeGeometry(0.15, 0.3, 4);
            const tailMat = new THREE.MeshToonMaterial({ color: new THREE.Color(color).multiplyScalar(0.7) });
            const tailMesh = new THREE.Mesh(tailGeo, tailMat);
            tailMesh.position.set(-0.25, 0, 0);
            tailMesh.rotation.z = Math.PI / 2;
            group.add(tailMesh);
            const eyeGeo = new THREE.SphereGeometry(0.05, 4, 4);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
            leftEye.position.set(0.1, 0.05, 0.1);
            group.add(leftEye);
            const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
            rightEye.position.set(0.1, 0.05, -0.1);
            group.add(rightEye);
            return group;
        }

        function spawnFish(pos, type) {
            const color = type === 'flash' ? 0xc0c0c0 : 0x5a5a5a;
            const fishGroup = createFishMesh(color);
            fishGroup.position.copy(pos);
            fishGroup.position.y = -1.2 + Math.random() * 0.5;
            scene.add(fishGroup);
            const initSpeed = 0.04 + Math.random() * 0.05;
            const randomDir = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 0.8, (Math.random() -
                0.5) * 2).normalize();
            fishes.push({
                mesh: fishGroup,
                velocity: randomDir.multiplyScalar(initSpeed),
                type: type,
                alive: true,
                wanderTimer: Math.random() * 3,
                wanderTarget: new THREE.Vector3()
            });
        }

        // ============================================================
        //  8. 音频系统
        // ============================================================
        let audioCtx = null;
        let bgMusicPlaying = false;
        let bgMusicInterval = null;
        let bgMusicGainNode = null;
        let currentVolume = 0.15;

        const pentatonicFreqs = [
            261.63, 293.66, 329.63, 392.00, 440.00,
            523.25, 587.33, 659.25, 783.99, 880.00,
            130.81, 146.83, 164.81, 196.00, 220.00,
        ];

        function initAudioContext() {
            if (audioCtx) return;
            audioCtx = new(window.AudioContext || window.webkitAudioContext)();
            bgMusicGainNode = audioCtx.createGain();
            bgMusicGainNode.connect(audioCtx.destination);
            bgMusicGainNode.gain.value = currentVolume;
        }

        function setVolume(value) {
            currentVolume = value;
            if (bgMusicGainNode) {
                bgMusicGainNode.gain.setTargetAtTime(value, audioCtx.currentTime, 0.05);
            }
        }

        function playGuzhengNote(freq, time, duration = 0.6) {
            if (!audioCtx || !bgMusicGainNode) return;
            const now = audioCtx.currentTime + time;
            const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.03, audioCtx.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseData
                .length * 0.3));
            const noiseSrc = audioCtx.createBufferSource();
            noiseSrc.buffer = noiseBuffer;
            const noiseGain = audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.15, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
            noiseSrc.connect(noiseGain);
            noiseGain.connect(bgMusicGainNode);
            noiseSrc.start(now);
            noiseSrc.stop(now + 0.03);

            const osc = audioCtx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            const oscGain = audioCtx.createGain();
            oscGain.gain.setValueAtTime(0.25, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            osc.connect(oscGain);
            oscGain.connect(bgMusicGainNode);
            osc.start(now);
            osc.stop(now + duration);

            const osc2 = audioCtx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(freq * 2.01, now);
            const osc2Gain = audioCtx.createGain();
            osc2Gain.gain.setValueAtTime(0.06, now);
            osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);
            osc2.connect(osc2Gain);
            osc2Gain.connect(bgMusicGainNode);
            osc2.start(now);
            osc2.stop(now + duration * 0.7);
        }

        function startBgMusic() {
            if (!audioCtx) initAudioContext();
            if (bgMusicPlaying) return;
            bgMusicPlaying = true;
            const btn = document.getElementById('music-btn');
            btn.textContent = '暂停';
            btn.style.background = '#d4c4aa';

            function scheduleNext() {
                if (!bgMusicPlaying) return;
                const delay = 0.4 + Math.random() * 1.1;
                const freq = pentatonicFreqs[Math.floor(Math.random() * pentatonicFreqs.length)];
                playGuzhengNote(freq, 0, 0.5 + Math.random() * 0.7);
                bgMusicInterval = setTimeout(scheduleNext, delay * 1000);
            }
            scheduleNext();
        }

        function stopBgMusic() {
            bgMusicPlaying = false;
            if (bgMusicInterval) clearTimeout(bgMusicInterval);
            const btn = document.getElementById('music-btn');
            btn.textContent = '奏乐';
            btn.style.background = '#e8dcc8';
        }

        function toggleMusic() {
            initAudioContext();
            if (bgMusicPlaying) {
                stopBgMusic();
            } else {
                startBgMusic();
            }
        }

        function playDolphinSound() {
            if (!audioCtx) initAudioContext();
            const now = audioCtx.currentTime;
            const duration = 0.45;
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1500, now);
            osc.frequency.linearRampToValueAtTime(5000, now + duration * 0.4);
            osc.frequency.linearRampToValueAtTime(2200, now + duration * 0.7);
            osc.frequency.linearRampToValueAtTime(3500, now + duration);
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.linearRampToValueAtTime(0.22, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + duration);
            for (let i = 0; i < 3; i++) {
                const clickTime = now + 0.06 + i * 0.05;
                const clickOsc = audioCtx.createOscillator();
                clickOsc.type = 'sine';
                clickOsc.frequency.setValueAtTime(3000 + i * 800, clickTime);
                const clickGain = audioCtx.createGain();
                clickGain.gain.setValueAtTime(0.08, clickTime);
                clickGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.03);
                clickOsc.connect(clickGain);
                clickGain.connect(audioCtx.destination);
                clickOsc.start(clickTime);
                clickOsc.stop(clickTime + 0.03);
            }
        }

        document.getElementById('music-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMusic();
        });

        const volumeSlider = document.getElementById('volume-slider');
        volumeSlider.addEventListener('input', (e) => {
            e.stopPropagation();
            const val = parseInt(e.target.value) / 100;
            setVolume(val * 0.3);
        });
        volumeSlider.addEventListener('change', (e) => { e.stopPropagation(); });
        volumeSlider.addEventListener('click', (e) => { e.stopPropagation(); });
        volumeSlider.addEventListener('pointerdown', (e) => { e.stopPropagation(); });

        document.getElementById('music-panel').addEventListener('click', (e) => { e.stopPropagation(); });
        document.getElementById('music-panel').addEventListener('pointerdown', (e) => { e.stopPropagation(); });

        // ============================================================
        //  9. 随机对话列表
        // ============================================================
		const randomDialogues = [
		"咕噜咕噜…好困。",
		"好饿。我想跑去食堂了。",
		"那边有吃的吗？",
		"写啊写～",
		"没有空调好热！校长呢？",
		"嗯？什么东西？",
		"又饿了…老师又在拖堂…",
		"再写一会儿吧。",
		"好像有香味！",
		"哈欠～这道题你会吗？",
		"考砸了怎么办啊啊啊！",
		"今日宜摸鱼。",
		"题写不完。好难，谁来救救我。",
		"啵，作业写不完了呜呜。",
		"叭，明天考试，我还没复习。",
		"咕，不想努力了，躺平吧。",
];

        function getRandomDialogue() {
            return randomDialogues[Math.floor(Math.random() * randomDialogues.length)];
        }

        // ============================================================
        //  10. 拖拽交互
        // ============================================================
        let draggedType = null;
        let isDragging = false;
        const fishItems = document.querySelectorAll('.fish-drag-item');
        fishItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                isDragging = true;
                draggedType = e.target.closest('.fish-drag-item').dataset.type;
                e.dataTransfer.setData('text/plain', draggedType);
                e.target.closest('.fish-drag-item').style.opacity = '0.5';
            });
            item.addEventListener('dragend', (e) => {
                e.target.closest('.fish-drag-item').style.opacity = '1';
                draggedType = null;
                setTimeout(() => { isDragging = false; }, 150);
            });
            item.addEventListener('touchstart', (e) => {
                isDragging = true;
                draggedType = e.target.closest('.fish-drag-item').dataset.type;
                e.target.closest('.fish-drag-item').style.opacity = '0.5';
            });
            item.addEventListener('touchend', (e) => {
                e.target.closest('.fish-drag-item').style.opacity = '1';
                if (draggedType) {
                    const touch = e.changedTouches[0];
                    const mouse = new THREE.Vector2();
                    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
                    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
                    handleDrop(mouse, draggedType);
                    draggedType = null;
                }
                setTimeout(() => { isDragging = false; }, 150);
            });
        });
        renderer.domElement.addEventListener('dragover', (e) => e.preventDefault());
        renderer.domElement.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!draggedType) return;
            const mouse = new THREE.Vector2();
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            handleDrop(mouse, draggedType);
            draggedType = null;
            isDragging = false;
        });

        function handleDrop(mouse, type) {
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.5);
            const point = new THREE.Vector3();
            if (raycaster.ray.intersectPlane(plane, point)) {
                spawnFish(point, type);
            }
        }

        // ============================================================
        //  11. 点击虎鲸检测
        // ============================================================
        function isClickOnOrca(mouse) {
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(orcaGroup.children, true);
            return intersects.length > 0;
        }

        window.addEventListener('click', (e) => {
            if (e.target.closest('#scroll-menu') || e.target.closest('#music-panel') ||
                e.target.closest('#hit-counter-panel') || isDragging) {
                return;
            }
            const mouse = new THREE.Vector2();
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            initAudioContext();
            if (!bgMusicPlaying && audioCtx) {
                startBgMusic();
            }

            if (isClickOnOrca(mouse)) {
                playDolphinSound();
                const dialogue = getRandomDialogue();
                showBubble(dialogue, orcaGroup.position);
                animateOrcaBounce();
            } else if (e.target === renderer.domElement) {
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, camera);
                const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.5);
                const point = new THREE.Vector3();
                if (raycaster.ray.intersectPlane(plane, point)) {
                    addRipple(point);
                }
            }
        });

        window.addEventListener('touchend', (e) => {
            if (isDragging) return;
            if (e.target.closest('#scroll-menu') || e.target.closest('#music-panel') ||
                e.target.closest('#hit-counter-panel')) {
                return;
            }
            const touch = e.changedTouches[0];
            if (!touch) return;
            const mouse = new THREE.Vector2();
            mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

            initAudioContext();
            if (!bgMusicPlaying && audioCtx) {
                startBgMusic();
            }

            if (isClickOnOrca(mouse)) {
                playDolphinSound();
                const dialogue = getRandomDialogue();
                showBubble(dialogue, orcaGroup.position);
                animateOrcaBounce();
            } else if (e.target === renderer.domElement || e.target.tagName === 'CANVAS') {
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, camera);
                const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.5);
                const point = new THREE.Vector3();
                if (raycaster.ray.intersectPlane(plane, point)) {
                    addRipple(point);
                }
            }
        });

        let bounceAnim = false;

        function animateOrcaBounce() {
            if (bounceAnim) return;
            const startY = orcaGroup.position.y;
            const bounceHeight = 0.4;
            const duration = 400;
            const startTime = performance.now();
            bounceAnim = true;

            function step() {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const bounce = Math.sin(progress * Math.PI * 2) * bounceHeight * (1 - progress);
                orcaGroup.position.y = startY + bounce;
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    orcaGroup.position.y = startY;
                    bounceAnim = false;
                }
            }
            requestAnimationFrame(step);
        }

        // ============================================================
        //  12. 气泡 + 命中计数
        // ============================================================
        const bubbleEl = document.getElementById('speech-bubble');
        const hitCountEl = document.getElementById('hit-count');
        let hitCount = 0;

        function showBubble(text, worldPos) {
            const vector = worldPos.clone().project(camera);
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-vector.y * 0.5 + 0.5) * window.innerHeight - 120;
            bubbleEl.style.left = x + 'px';
            bubbleEl.style.top = y + 'px';
            bubbleEl.textContent = text;
            bubbleEl.style.display = 'block';
            bubbleEl.style.opacity = '1';
            clearTimeout(bubbleEl._timeout);
            bubbleEl._timeout = setTimeout(() => {
                bubbleEl.style.opacity = '0';
                setTimeout(() => { bubbleEl.style.display = 'none'; }, 500);
            }, 2200);
        }

        function incrementHitCache() {
            hitCount++;
            hitCountEl.textContent = hitCount;
            hitCountEl.classList.add('pop');
            setTimeout(() => hitCountEl.classList.remove('pop'), 180);
        }

        // ============================================================
        //  13. 动画循环 ———— ★ 核心修改：优化觅食逻辑 ★
        // ============================================================
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, -0.5, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.4;
        controls.maxPolarAngle = Math.PI;
        controls.minDistance = 3.8;
        controls.maxDistance = 22;
        controls.update();

        const pectoralLeft = leftPecGroup;
        const pectoralRight = rightPecGroup;
        const tailFin = tailGroup;
        let catchCooldown = 0;
        let patrolOffsetX = 0,
            patrolOffsetZ = 0;
        let patrolTimer = 0;

        // ★ 新增：当前追逐的目标鱼 (只在吃完后重新检索)
        let currentTarget = null;

        function animate() {
            requestAnimationFrame(animate);
            const elapsedTime = performance.now() * 0.001;
            if (catchCooldown > 0) catchCooldown -= 0.016;

            // ----- 荷花浮动 -----
            lotusFlowers.forEach(flower => {
                const floatOffset = Math.sin(elapsedTime * flower.floatSpeed + flower.phase) * 0.06;
                flower.group.position.y = flower.baseY + floatOffset;
                flower.group.rotation.y += flower.rotSpeed;
                flower.group.rotation.x = Math.sin(elapsedTime * 0.5 + flower.phase) * 0.03;
                flower.group.rotation.z = Math.cos(elapsedTime * 0.55 + flower.phase) * 0.03;
            });

            // ----- 涟漪更新 -----
            for (let i = ripples.length - 1; i >= 0; i--) {
                const r = ripples[i];
                r.life -= 0.02;
                r.mesh.scale.setScalar(1 + (1 - r.life) * 2.5);
                r.mesh.material.opacity = r.life * 0.55;
                if (r.life <= 0) {
                    scene.remove(r.mesh);
                    r.mesh.geometry.dispose();
                    r.mesh.material.dispose();
                    ripples.splice(i, 1);
                }
            }

            // ----- 鱼群 AI (逃跑 / 漫游) -----
            for (let fish of fishes) {
                if (!fish.alive) continue;
                const distToOrca = orcaGroup.position.distanceTo(fish.mesh.position);
                if (distToOrca < 1.8) {
                    const runDir = fish.mesh.position.clone().sub(orcaGroup.position).normalize();
                    fish.velocity.add(runDir.multiplyScalar(0.003));
                }
                fish.wanderTimer -= 0.016;
                if (fish.wanderTimer <= 0) {
                    fish.wanderTimer = 1.5 + Math.random() * 3.5;
                    fish.wanderTarget.set(
                        fish.mesh.position.x + (Math.random() - 0.5) * 4,
                        Math.max(-2.0, Math.min(-0.6, fish.mesh.position.y + (Math.random() - 0.5) * 1.5)),
                        fish.mesh.position.z + (Math.random() - 0.5) * 4
                    );
                }
                const toWander = fish.wanderTarget.clone().sub(fish.mesh.position);
                if (toWander.lengthSq() > 0.01) fish.velocity.add(toWander.normalize().multiplyScalar(0.0015));
                if (Math.random() < 0.015) {
                    fish.velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), (Math.random() - 0.5) * 0.5);
                    fish.velocity.applyAxisAngle(new THREE.Vector3(1, 0, 0), (Math.random() - 0.5) * 0.25);
                }
                fish.velocity.clampLength(0.015, 0.07);
                fish.mesh.position.add(fish.velocity);
                if (Math.abs(fish.mesh.position.x) > 6.5) fish.velocity.x *= -0.8;
                if (Math.abs(fish.mesh.position.z) > 5.5) fish.velocity.z *= -0.8;
                if (fish.mesh.position.y > -0.5) fish.velocity.y -= 0.002;
                if (fish.mesh.position.y < -2.2) fish.velocity.y += 0.002;
                fish.mesh.position.x = Math.max(-7, Math.min(7, fish.mesh.position.x));
                fish.mesh.position.z = Math.max(-6, Math.min(6, fish.mesh.position.z));
                fish.mesh.position.y = Math.max(-2.2, Math.min(-0.5, fish.mesh.position.y));
                if (fish.velocity.lengthSq() > 0.0001) fish.mesh.lookAt(fish.mesh.position.clone().add(fish.velocity));
            }

            // ★ 优化：只在没有目标 或 目标已死亡时，才遍历鱼群找最近的
            if (!currentTarget || !currentTarget.alive) {
                let closestFish = null,
                    closestDist = Infinity;
                for (let fish of fishes) {
                    if (!fish.alive) continue;
                    const d = orcaGroup.position.distanceTo(fish.mesh.position);
                    if (d < closestDist) {
                        closestDist = d;
                        closestFish = fish;
                    }
                }
                currentTarget = closestFish;
                // 如果目标距离太远（>6.0），放弃它，继续巡逻
                if (currentTarget) {
                    const dist = orcaGroup.position.distanceTo(currentTarget.mesh.position);
                    if (dist > 6.0) currentTarget = null;
                }
            }

            // ----- 巡逻路径（作为 fallback）-----
            patrolTimer += 0.016;
            if (patrolTimer > 5 + Math.random() * 3) {
                patrolTimer = 0;
                patrolOffsetX = (Math.random() - 0.5) * 2.0;
                patrolOffsetZ = (Math.random() - 0.5) * 1.5;
            }
            const swimRadiusX = 1.8,
                swimRadiusZ = 1.2,
                swimSpeed = 0.55;
            const angleX = elapsedTime * swimSpeed;
            const angleZ = elapsedTime * swimSpeed * 2;
            const targetX = Math.sin(angleX) * swimRadiusX + patrolOffsetX;
            const targetZ = Math.cos(angleZ) * swimRadiusZ * 0.9 + patrolOffsetZ;
            const targetY = Math.sin(elapsedTime * 0.9) * 0.3 + 0.2;
            let moveTarget = new THREE.Vector3(targetX, targetY, targetZ);
            let isChasing = false;

            // ----- 虎鲸追逐 & 捕食（使用 currentTarget）-----
            if (currentTarget && currentTarget.alive) {
                const dist = orcaGroup.position.distanceTo(currentTarget.mesh.position);
                if (dist < 5.0 && catchCooldown <= 0) {
                    isChasing = true;
                    moveTarget.copy(currentTarget.mesh.position);
                    // 吃到鱼！
                    if (dist < 1.2) {
                        scene.remove(currentTarget.mesh);
                        currentTarget.alive = false;
                        showBubble("我写完了！", orcaGroup.position);
                        incrementHitCache();
                        catchCooldown = 0.8;
                        isChasing = false;
                        moveTarget.set(targetX, targetY, targetZ);
                        // ★ 吃完后清空目标，下一帧重新检索最近的鱼
                        currentTarget = null;
                    }
                } else if (dist > 6.0) {
                    // 目标太远，放弃，重新检索
                    currentTarget = null;
                }
            }

            // ----- 虎鲸平滑移动 -----
            const lerpFactor = isChasing ? 0.07 : 0.035;
            if (!bounceAnim) orcaGroup.position.lerp(moveTarget, lerpFactor);

            // ----- 虎鲸朝向 -----
            let dirX, dirZ;
            if (isChasing && currentTarget && currentTarget.alive) {
                dirX = currentTarget.mesh.position.x - orcaGroup.position.x;
                dirZ = currentTarget.mesh.position.z - orcaGroup.position.z;
            } else {
                dirX = Math.sin((elapsedTime + 0.08) * swimSpeed) * swimRadiusX + patrolOffsetX - orcaGroup.position.x;
                dirZ = Math.cos((elapsedTime + 0.08) * swimSpeed * 2) * swimRadiusZ * 0.9 + patrolOffsetZ - orcaGroup
                    .position.z;
            }
            const targetRotY = Math.atan2(dirX, dirZ);
            let rotDiff = targetRotY - orcaGroup.rotation.y;
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            orcaGroup.rotation.y += rotDiff * (isChasing ? 0.09 : 0.05);
            orcaGroup.rotation.z += (Math.sin(elapsedTime * 2) * 0.08 - orcaGroup.rotation.z) * 0.06;
            orcaGroup.rotation.x += ((moveTarget.y - orcaGroup.position.y) * 0.8 - orcaGroup.rotation.x) * 0.04;

            // ----- 胸鳍 & 尾鳍动画 -----
            if (pectoralLeft && pectoralRight) {
                const flapSpeed = isChasing ? 9.0 : 7.0;
                const flapAmplitude = isChasing ? 0.45 : 0.35;
                const flapAngle = Math.sin(elapsedTime * flapSpeed) * flapAmplitude;
                pectoralLeft.rotation.x = PECTORAL_LEFT.rotation[0] + flapAngle * 0.65;
                pectoralLeft.rotation.z = PECTORAL_LEFT.rotation[2] + Math.cos(elapsedTime * (flapSpeed - 0.5)) * 0.12;
                pectoralRight.rotation.x = -0.25 + flapAngle * 0.65;
                pectoralRight.rotation.z = -0.15 - Math.cos(elapsedTime * (flapSpeed - 0.5)) * 0.12;
            }
            if (tailFin) {
                const tailSpeed = isChasing ? 7.0 : 5.0;
                const tailAmplitude = isChasing ? 0.5 : 0.35;
                tailFin.rotation.x = Math.sin(elapsedTime * tailSpeed) * tailAmplitude + Math.sin(elapsedTime *
                    tailSpeed * 2.1 + 0.7) * 0.08;
                tailFin.rotation.z = Math.cos(elapsedTime * tailSpeed * 0.7) * 0.06;
                tailFin.rotation.y = Math.sin(elapsedTime * 2.8) * 0.04;
            }

            controls.target.lerp(orcaGroup.position, 0.05);
            controls.update();
            renderer.render(scene, camera);

            // 清理已死亡的鱼
            for (let i = fishes.length - 1; i >= 0; i--) {
                if (!fishes[i].alive) fishes.splice(i, 1);
            }
        }
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);
        });

        console.log('水墨虎鲸');
