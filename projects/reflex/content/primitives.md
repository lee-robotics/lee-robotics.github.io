# Primitives content

<!-- Edit the text below each ## key. Keep the keys unchanged. -->

## caption

**Interaction primitives.** Interactive visualization of the spring, plane, and rail interaction forces.

## instructions

Drag the colored axis arrows or use the sliders to move the end effector. Drag the background to rotate the view. The orange arrow shows the interaction force. **Reset** restores the position and view.

## spring-title

Spring constraint

## spring-description

The spring pulls the end-effector back toward a sampled anchor position. Displacement and velocity determine the restoring force.

## spring-formula

F = k(xₐ − x) − bẋ

## spring-tag

ANCHORED MOTION

## spring-constraint

Displacement from a point

## spring-example

Like moving against an elastic tether.

## spring-accessible

Spring: displacement from an anchor creates a restoring force.

## plane-tag

SURFACE CONTACT

## plane-title

Plane constraint

## plane-description

The plane pushes back only when the end-effector penetrates it. Force acts along the surface normal, leaving motion across the surface free.

## plane-constraint

One direction, on contact

## plane-example

Like wiping or following a surface.

## plane-formula

f = −kd − bvₙ, when d < 0

## plane-accessible

Plane: a surface resists penetration in its normal direction, while tangential motion is free.

## rail-tag

GUIDED MOTION

## rail-title

Rail constraint

## rail-description

The rail pulls the end-effector toward a fixed line. It constrains two translational directions while leaving motion along the rail free.

## rail-constraint

Two directions, perpendicular to a line

## rail-example

Like a peg guided inside a bore.

## rail-formula

f = kd + bv, toward the rail

## rail-accessible

Rail: restoring force points toward a line, while motion along that line remains free.
