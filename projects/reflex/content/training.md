# Training content

<!-- Edit the text below each ## key. Keep the keys unchanged. -->

## heading

Method

## overview-summary
We train the reflex policy in simulation using reinforcement learning. The policy takes as input a history of robot states, an end-effector pose command, and a binary compliance mode. It outputs a joint-position command, which is then used by the robot’s low-level controller.

To simulate different interactions, we apply interaction forces at the robot’s end effector that depend on its position in space. We call these *interaction primitives*. There are three interaction primitives: spring, plane, and rail. The spring pulls the end effector toward a set point. The plane pushes it back when it penetrates the plane. The rail pulls it toward a straight line in space.

## overview-caption

**Method overview.** Training and deployment of the proprioceptive reflex policy.

## overview-alt

Overview of proprioceptive reflex learning for contact-rich manipulation.
