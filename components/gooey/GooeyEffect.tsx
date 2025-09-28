"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GUI from "lil-gui";

gsap.registerPlugin(ScrollTrigger);

type UniformMap = { [name: string]: WebGLUniformLocation | null };

const vertShaderSrc = `
precision mediump float;

varying vec2 vUv;
attribute vec2 a_position;

void main() {
  vUv = a_position;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragShaderSrc = `
precision mediump float;

varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_scroll_progr;
uniform float u_col_width;
uniform float u_seed;
uniform float u_scale;
uniform float u_time;
uniform float u_speed;
uniform float u_opacity;
uniform vec3 u_color;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float get_l(vec2 v) {
  return 1. - clamp(0., 1., length(v));
}

float rand(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  float scale = .001 * u_scale;
  float speed = .001 * u_speed;

  vec2 uv = vUv;
  uv.x *= (scale * u_resolution.x);

  vec2 noise_uv = uv;
  noise_uv *= 5.;
  noise_uv.y *= (.25 * scale * u_resolution.y);
  noise_uv += vec2(0., u_time * 1.5 * speed);
  float shape = 0.;
  shape += snoise(noise_uv);
  shape = clamp(.5 + .5 * shape, 0., 1.);
  shape *= pow(.5 * uv.y + .7 + pow(u_scroll_progr, 2.) + (.4 * u_scroll_progr * (1. - pow(vUv.x - .2, 2.))), 10.);
  shape = clamp(shape, 0., 1.);

  float dots = 0.;
  float bars = 0.;
  float light = 0.;

  const int num_col = 9;
  for (int i = 0; i < num_col; i++) {

    vec2 col_uv = vUv;

    float start_time_offset = rand(100. * (float(i) + u_seed));
    float c_t = fract(u_time * speed + start_time_offset);
    float drop_time = .2 + .6 * rand(10. * (float(i) + u_seed));

    float before_drop_normal = c_t / drop_time;
    float before_drop_t = pow(before_drop_normal, .4) * drop_time;
    float after_drop_normal = max(0., c_t - drop_time) / (1. - drop_time);
    float after_drop_t_dot = 3. * pow(after_drop_normal, 2.) * (1. - drop_time);
    float after_drop_t_bar = pow(after_drop_normal, 2.) * (drop_time);

    float eased_drop_t = step(c_t, drop_time) * before_drop_t;
    eased_drop_t += step(drop_time, c_t) * (drop_time + after_drop_t_dot);

    col_uv.y += (1. + 3. * rand(15. * float(i))) * u_scroll_progr;

    col_uv.x *= (u_resolution.x / u_resolution.y);
    col_uv *= (7. * scale * u_resolution.y);

    col_uv.x += (u_col_width * (.5 * float(num_col) - float(i)));

    vec2 dot_uv = col_uv;
    dot_uv.y += 4. * (eased_drop_t - .5);

    float dot = get_l(dot_uv);
    dot = pow(dot, 4.);

    float drop_grow = step(c_t, drop_time) * pow(before_drop_normal, .4);
    drop_grow += step(drop_time, c_t) * mix(1., .8, clamp(7. * after_drop_normal, 0., 1.));
    dot *= drop_grow;

    dot *= step(.5, drop_time);
    dots += dot;

    vec2 bar_uv = col_uv;
    bar_uv.y += step(c_t, drop_time) * 4. * (before_drop_t - .5);
    bar_uv.y += step(drop_time, c_t) * 4. * (drop_time - after_drop_t_bar - .5);

    float bar = smoothstep(-.5, 0., bar_uv.x) * (1. - smoothstep(0., .5, bar_uv.x));
    bar = pow(bar, 4.);
    light += bar * smoothstep(.0, .1, -bar_uv.x);
    float bar_mask = smoothstep(-.2, .2, bar_uv.y);
    bar *= bar_mask;

    bars += bar;
  }

  shape += bars;
  shape = clamp(shape, 0., 1.);
  shape += dots;

  float gooey = smoothstep(.48, .5, shape);
  gooey -= .1 * smoothstep(.5, .6, shape);
  vec3 color = u_color;
  color.r += .2 * (1. - vUv.y) * (1. - u_scroll_progr);
  color *= gooey;
  color = mix(color, vec3(1.), max(0., 1. - 2. * vUv.y) * light * smoothstep(.1, .7, snoise(.5 * uv)) * (smoothstep(.49, .6, shape) - smoothstep(.6, 1., shape)));

  gl_FragColor = vec4(color, gooey);
}
`;

export default function GooeyEffect() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scrollMsgRef = useRef<HTMLDivElement>(null);
    const arrowWrapRef = useRef<HTMLDivElement>(null);
    const textOverlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current!;
        const canvas = canvasRef.current!;
        const textOverlay = textOverlayRef.current!;
        const scrollMsg = scrollMsgRef.current!;
        const arrowWrap = arrowWrapRef.current!;

        const DPR = Math.min(window.devicePixelRatio || 1, 2);

        const params = {
            scrollProgress: 0,
            colWidth: 0.7,
            speed: 0.2,
            scale: 0.25,
            seed: 0.231,
            color: [0.235, 0.635, 0.062] as [number, number, number],
            pageColor: "#ffffff"
        };

        document.body.style.backgroundColor = params.pageColor;

        // WebGL init
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) return;

        function createShader(source: string, type: number) {
            const shader = (gl as WebGLRenderingContext).createShader(type)!;
            (gl as WebGLRenderingContext).shaderSource(shader, source);
            (gl as WebGLRenderingContext).compileShader(shader);
            if (!(gl as WebGLRenderingContext).getShaderParameter(shader, (gl as WebGLRenderingContext).COMPILE_STATUS)) {
                console.error("Shader compile error:", (gl as WebGLRenderingContext).getShaderInfoLog(shader));
                (gl as WebGLRenderingContext).deleteShader(shader);
                return null;
            }
            return shader;
        }

        const vertexShader = createShader(vertShaderSrc, (gl as WebGLRenderingContext).VERTEX_SHADER)!;
        const fragmentShader = createShader(fragShaderSrc, (gl as WebGLRenderingContext).FRAGMENT_SHADER)!;

        function createProgram(vs: WebGLShader, fs: WebGLShader) {
            const program = (gl as WebGLRenderingContext).createProgram()!;
            (gl as WebGLRenderingContext).attachShader(program, vs);
            (gl as WebGLRenderingContext).attachShader(program, fs);
            (gl as WebGLRenderingContext).linkProgram(program);
            if (!(gl as WebGLRenderingContext).getProgramParameter(program, (gl as WebGLRenderingContext).LINK_STATUS)) {
                console.error("Program link error:", (gl as WebGLRenderingContext).getProgramInfoLog(program));
                return null;
            }
            return program;
        }

        const program = createProgram(vertexShader, fragmentShader)!;
        (gl as WebGLRenderingContext).useProgram(program);

        // uniforms
        function getUniforms(p: WebGLProgram) {
            const uniforms: UniformMap = {};
            const count = (gl as WebGLRenderingContext).getProgramParameter(p, (gl as WebGLRenderingContext).ACTIVE_UNIFORMS) as number;
            for (let i = 0; i < count; i++) {
                const info = (gl as WebGLRenderingContext).getActiveUniform(p, i)!;
                uniforms[info.name] = (gl as WebGLRenderingContext).getUniformLocation(p, info.name);
            }
            return uniforms;
        }

        const uniforms = getUniforms(program);

        // geometry
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const vertexBuffer = (gl as WebGLRenderingContext).createBuffer()!;
        (gl as WebGLRenderingContext).bindBuffer((gl as WebGLRenderingContext).ARRAY_BUFFER, vertexBuffer);
        (gl as WebGLRenderingContext).bufferData((gl as WebGLRenderingContext).ARRAY_BUFFER, vertices, (gl as WebGLRenderingContext).STATIC_DRAW);

        const positionLocation = (gl as WebGLRenderingContext).getAttribLocation(program, "a_position");
        (gl as WebGLRenderingContext).enableVertexAttribArray(positionLocation);
        (gl as WebGLRenderingContext).vertexAttribPointer(positionLocation, 2, (gl as WebGLRenderingContext).FLOAT, false, 0, 0);

        // set initial uniforms
        (gl as WebGLRenderingContext).uniform1f(uniforms.u_col_width, params.colWidth);
        (gl as WebGLRenderingContext).uniform1f(uniforms.u_speed, params.speed);
        (gl as WebGLRenderingContext).uniform1f(uniforms.u_scale, params.scale);
        (gl as WebGLRenderingContext).uniform1f(uniforms.u_seed, params.seed);
        (gl as WebGLRenderingContext).uniform3f(uniforms.u_color, params.color[0], params.color[1], params.color[2]);

        function resize() {
            canvas.width = Math.floor(window.innerWidth * DPR);
            canvas.height = Math.floor(window.innerHeight * DPR);
            (gl as WebGLRenderingContext).viewport(0, 0, canvas.width, canvas.height);
            (gl as WebGLRenderingContext).uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
        }

        window.addEventListener("resize", resize);
        resize();

        let raf = 0;
        function render() {
            const t = performance.now();
            (gl as WebGLRenderingContext).uniform1f(uniforms.u_time, t);
            (gl as WebGLRenderingContext).uniform1f(uniforms.u_scroll_progr, params.scrollProgress);
            (gl as WebGLRenderingContext).drawArrays((gl as WebGLRenderingContext).TRIANGLE_STRIP, 0, 4);
            raf = requestAnimationFrame(render);
        }
        render();

        // Scroll-linked animations
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: container,
                start: "0% 0%",
                end: "100% 100%",
                scrub: true,
                // markers: true,
            },
        });
        tl.to(params, { scrollProgress: 1 }, 0)
            .to(arrowWrap, { duration: 0.2, y: 50, opacity: 0 }, 0)
            .to(scrollMsg, { opacity: 0 }, 0)
            .to(textOverlay, { duration: 0.3, opacity: 1 }, 0.5)
            .progress(0);

        gsap.set(container, { opacity: 1 });

        // Controls
        const gui = new GUI();
        gui.close();
        gui.add(params, "colWidth", 0.2, 1.5).onChange((v: number) => {
            (gl as WebGLRenderingContext).uniform1f(uniforms.u_col_width, v);
        }).name("column width");
        gui.add(params, "scale", 0.15, 0.35).onChange((v: number) => {
            (gl as WebGLRenderingContext).uniform1f(uniforms.u_scale, v);
        });
        gui.add(params, "speed", 0, 1).onChange((v: number) => {
            (gl as WebGLRenderingContext).uniform1f(uniforms.u_speed, v);
        });
        gui.add(params, "seed", 0, 1).onChange((v: number) => {
            (gl as WebGLRenderingContext).uniform1f(uniforms.u_seed, v);
        });
        gui.addColor(params, "color").onChange((v: number[]) => {
            (gl as WebGLRenderingContext).uniform3f(uniforms.u_color, v[0], v[1], v[2]);
        });
        gui.addColor(params, "pageColor").onChange((v: string) => {
            document.body.style.backgroundColor = v;
        });

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
            try { gui.destroy(); } catch { }
            try { tl.scrollTrigger?.kill(); tl.kill(); } catch { }
        };
    }, []);

    return (
        <div ref={containerRef} className="page">
            <div ref={scrollMsgRef} className="scroll-msg">
                <div>Hello 👋</div>
                <div>scroll me</div>
                <div ref={arrowWrapRef} className="arrow-animated-wrapper">
                    <div className="arrow-animated">&darr;</div>
                </div>
            </div>

            <canvas ref={canvasRef} id="gooey-overlay" />

            <div ref={textOverlayRef} className="text-overlay">
                <p>
                    <a href="https://linkedin.com/in/ksenia-kondrashova/" target="_blank" rel="noreferrer">linkedIn</a>
                    {" "}|{" "}
                    <a href="https://codepen.io/ksenia-k" target="_blank" rel="noreferrer">codepen</a>
                    {" "}|{" "}
                    <a href="https://twitter.com/uuuuuulala" target="_blank" rel="noreferrer">twitter (X)</a>
                </p>
            </div>

            {/* Styles ported from CodePen */}
            <style jsx global>{`
        .page {
          width: 100%;
          min-height: 1500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          opacity: 0;
        }
    .text-overlay,
    .scroll-msg {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
    .scroll-msg { margin-top: 2em; pointer-events: none; background: #ffffff; }
        .scroll-msg > div:nth-child(1) {
          margin-top: -10vh;
          padding-bottom: 1em;
          text-transform: uppercase;
          font-size: 2em;
        }
        .text-overlay { position: fixed; top: 0; left: 0; opacity: 0; }
        canvas#gooey-overlay { position: fixed; top: 0; left: 0; display: block; width: 100%; pointer-events: none; }
        .arrow-animated { font-size: 1em; animation: arrow-float 1s infinite; }
        @keyframes arrow-float {
          0% { transform: translateY(0); animation-timing-function: ease-out; }
          60% { transform: translateY(50%); animation-timing-function: ease-in-out; }
          100% { transform: translateY(0); animation-timing-function: ease-out; }
        }
        .lil-gui { --width: 350px; max-width: 90%; --widget-height: 20px; font-size: 15px; --input-font-size: 15px; --padding: 10px; --spacing: 10px; --slider-knob-width: 5px; --background-color: rgba(5, 0, 15, .8); --widget-color: rgba(255, 255, 255, .3); --focus-color: rgba(255, 255, 255, .4); --hover-color: rgba(255, 255, 255, .5); --font-family: monospace; }
        .lil-gui.autoPlace { z-index: 1; }
        body, html { margin: 0; padding: 0; font-family: sans-serif; font-size: 20px; }
        a { color: inherit; }
      `}</style>
        </div>
    );
}
