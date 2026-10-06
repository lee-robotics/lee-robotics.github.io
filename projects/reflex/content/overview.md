# Overview content

<!-- Edit the text below each ## key. Keep the keys unchanged. -->

## title

Learning Reflexive Behavior for Contact-Rich Manipulation

## authors

Quan Nguyen, Yunho Kim, Joonho Lee

## tldr

**TL;DR:** Using three interaction primitives, we train a blind policy in simulation that adapts robot motion to local environmental constraints, keeping interaction forces within a desired range while preserving task intent. The policy serves as an adaptive layer between task-level commands and the low-level robot controller.

## abstract

During contact-rich manipulation, interactions between a robot and its environment carry information about local geometry: a surface prevents penetration, a bore guides a peg. A controller that exploits these interactions can comply with environmental constraints while preserving task intent. Robot-learning systems commonly use position, hybrid force–position, or Cartesian impedance control. Their prescribed tracking objectives, stiffness, or force-control directions may not match local constraints and may degrade performance. We learn a proprioceptive reflex policy in simulation on three simple interaction primitives: a spring, a plane, and a rail. The policy maps task-space commands to joint-position targets using state history, without direct force or geometrical measurements. Once trained, it serves as a frozen execution layer beneath higher-level controllers. We evaluate it in dual-arm box lifting, peg insertion, and surface following. In box lifting, the reflex kept the force below the threshold while the baseline failed. In rough-surface following it stayed below the 10 N reference, on par with tuned hybrid force-position control. In 0.02 mm peg insertion it reduced mean estimated contact force to less than half that of IK + PD while increasing hardware success rates from at most 22% to 36–58%. By separating contact response from command generation, the reflex policy provides motion planners, learned policies, and teleoperators with robust contact-rich execution.

## video-caption

**Overview video.**
