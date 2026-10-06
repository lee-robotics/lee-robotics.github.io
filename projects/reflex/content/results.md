# Results content

<!-- Edit the text below each ## key. Keep the keys unchanged. -->

## heading

Results

## intro

We evaluated our reflex policy on three tasks: dual-arm box lifting, tight-clearance peg insertion, and surface following, using two different robots.

## tasks-heading

Tasks

## task-box-description

We used a dual-arm humanoid robot to lift a box. To provide high-level commands, we generated open-loop hand trajectories with target positions at varying depths inside the box.

## task-peg-description

We used a custom-built robot for the peg-in-hole insertion task in [ManipulationNet](https://manipulation-net.org/). To provide high-level commands to the reflex policy, we trained an insertion policy in simulation using reinforcement learning.

## task-surface-description

We evaluated rough surface following with our custom-built robot in simulation. The surface was generated using Perlin noise, and high-level commands were provided by a generated trajectory.

## findings-heading

Experimental Findings

## q1-heading

Q1. Can the reflex policy limit contact force and maintain task success under imperfect commands where conventional execution layers fail?

## q1-answer

To answer this question, we first evaluated whether the reflex policy is effective in limiting contact force with the dual-arm box lifting task. Experiment results in both simulation and real indicates that this is effective.

## box-force-caption

Simulation force for different penetration depths in the dual-arm box lifting task.

## q2-heading

Q2. Does training with interaction primitives matter, or can classical compliant controllers achieve the same benefits?

## q2-answer

To answer this question, we first conducted a simulation ablation study on the peg-in-hole task to evaluate the contribution of each interaction primitive. The results show a clear benefit from each primitive at tight tolerances (0.02 mm and 0.1 mm): removing any one primitive reduced the mean insertion success rate.

## compliance-comparison

Finally, we evaluated whether classical compliant controllers—hybrid force–position control and task-space impedance control—could achieve the same benefits. Using the surface-following task, we varied their gains to assess whether they could match our reflex policy’s performance. Across the tested gains, these controllers faced a trade-off between position tracking accuracy and contact force, while our reflex policy achieved this balance without task-specific tuning.

## ablation-table-description

Insertion success rates for the full reflex policy and variants trained without each interaction primitive in the simulated peg-in-hole task. Results are mean ± SD over five training seeds.

## eir-heading

Dual-arm Robot Box Lifting (Real)

## box-video-instructions

Comparison between IK and our reflex policy in the box-lifting task across different penetration depths. The IK controller generally made less stable contact and failed to lift the box at 17.5 cm. Our reflex policy lifted the box at all tested depths.

## box-depth-label

Commanded penetration depth

## peg-heading

Contact-Guided Peg Insertion (Real)

## peg-description

We then evaluated whether the reflex policy improves the performance of a learned high-level policy in peg-in-hole insertion. The results show that our method achieves higher success rates and shorter mean completion times in all reported comparisons across hole-position offsets and clearances.

## table-heading

Success rate

## table-description

Success rate and completion time comparison between IK and Ours in the peg-in-hole task. Completion times are mean ± SD over successful trials.

## peg-video-heading

Policy Deployment in the Peg-in-Hole Task

## surface-heading

Surface Following (Sim)

## surface-description

Finally, we compared our controller with IK + PD, hybrid force–position control, and task-space impedance control in a simulated surface-following task. We generated trajectories with different commanded penetration depths on flat and rough surfaces. Our controller achieved force regulation and tangential position tracking comparable to the hybrid controller, while impedance control was more sensitive to penetration depth on rough terrain. As expected, all three alternatives produced lower contact forces and tangential tracking errors than IK + PD.

## surface-plot-description

Contact force and tangential tracking error comparison between IK + PD, Hybrid, Impedance, and Ours during simulated surface following. The dashed line marks the 10 N force threshold; p95 denotes the 95th-percentile contact force.

## paper-link

See the [full paper](https://arxiv.org/abs/2610.02811) for training details, baseline comparisons, and ablation studies.
