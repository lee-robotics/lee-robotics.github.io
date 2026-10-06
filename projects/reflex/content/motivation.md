# Motivation content

<!-- Edit the text below each ## key. Keep the keys unchanged. -->

## heading

Motivation

## intro

Humans can feel the surface that they are interacting with and can adjust motions without looking. For example, during wiping, human doesn't need to look into the surface to maintain contact and apply the appropriate force. Inspired by this ability, we aim to enable robots to adapt to their environment similarly, balancing between force regulation and accurate position and orientation tracking.

## robot-context

To be more concrete, given a high level command in task space, we want to generate a low-level joint command to regulate the interaction force while maintain high position and orientation tracking accuracy. We call this a *reflex policy*.

## comparison-caption

Comparison of joint-position commands between an IK solver and our controller. In both videos, the orange robots show commanded joint positions, and the moving frames indicate the end-effector targets. The IK solver produces unsafe motions with high interaction forces, whereas our controller produces safer motions with lower interaction forces.
